using Askida.Api.Application.Interfaces;
using Askida.Api.Core.Interfaces;
using Askida.Api.Core.Models;
using Askida.Api.Domain.Entities;
using Askida.Api.Infrastructure.Security;
using Microsoft.Extensions.Options;

namespace Askida.Api.Infrastructure.Services;

public class PhoneVerificationService : IPhoneVerificationService
{
    private readonly IPhoneVerificationCodeRepository _codeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWhatsAppService _whatsAppService;
    private readonly IOtpRateLimitService _rateLimitService;
    private readonly OtpSettings _otpSettings;
    private readonly IWebHostEnvironment _environment;

    public PhoneVerificationService(
        IPhoneVerificationCodeRepository codeRepository,
        IUserRepository userRepository,
        IWhatsAppService whatsAppService,
        IOtpRateLimitService rateLimitService,
        IOptions<OtpSettings> otpSettings,
        IWebHostEnvironment environment)
    {
        _codeRepository = codeRepository;
        _userRepository = userRepository;
        _whatsAppService = whatsAppService;
        _rateLimitService = rateLimitService;
        _otpSettings = otpSettings.Value;
        _environment = environment;
    }

    public string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString();

    public async Task<(bool Success, string Message, string? DevOtp)> SendVerificationCodeAsync(string phoneNumber, bool allowExisting = false)
    {
        var normalized = PhoneNormalizer.Normalize(phoneNumber);
        if (normalized == null)
        {
            return (false, "Geçersiz telefon numarası.", null);
        }

        var existing = await _userRepository.GetByPhoneAsync(normalized);
        if (!allowExisting && existing != null)
        {
            return (false, "Bu telefon numarası zaten kayıtlı.", null);
        }

        var rateCheck = await _rateLimitService.CanSendOtpAsync(normalized);
        if (!rateCheck.Allowed)
        {
            return (false, rateCheck.ErrorMessage ?? "OTP gönderilemedi.", null);
        }

        var code = GenerateOtp();
        await _codeRepository.InvalidateActiveCodesAsync(normalized);

        var entity = new PhoneVerificationCode
        {
            PhoneNumber = normalized,
            CodeHash = OtpHasher.Hash(code, _otpSettings.HashSecret),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_otpSettings.ExpirationMinutes),
            AttemptCount = 0,
            IsUsed = false
        };

        await _codeRepository.AddAsync(entity);
        await _rateLimitService.RecordOtpSentAsync(normalized);

        _ = Task.Run(async () =>
        {
            try
            {
                await _whatsAppService.SendVerificationCodeAsync(normalized, code);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WhatsApp Error] {normalized}: {ex.Message}");
            }
        });

        if (!_whatsAppService.IsConfigured && _environment.IsDevelopment())
        {
            return (true, "Doğrulama kodu hazırlandı.", code);
        }

        return (true, "Doğrulama kodu WhatsApp'a gönderildi.", null);
    }

    public Task<(bool Success, string Message)> VerifyOtpAsync(string phoneNumber, string code)
    {
        return VerifyOtpInternalAsync(phoneNumber, code);
    }

    public Task<(bool Success, string Message)> ConsumeOtpForRegistrationAsync(string phoneNumber, string code)
    {
        return VerifyOtpInternalAsync(phoneNumber, code);
    }

    private async Task<(bool Success, string Message)> VerifyOtpInternalAsync(string phoneNumber, string code)
    {
        var normalized = PhoneNormalizer.Normalize(phoneNumber);
        if (normalized == null)
        {
            return (false, "Geçersiz telefon numarası.");
        }

        var record = await _codeRepository.GetActiveCodeAsync(normalized);
        if (record == null)
        {
            return (false, "Geçersiz veya süresi dolmuş kod.");
        }

        if (record.AttemptCount >= _otpSettings.MaxAttempts)
        {
            record.IsUsed = true;
            await _codeRepository.UpdateAsync(record);
            return (false, "Maksimum deneme sayısına ulaşıldı. Yeni kod isteyin.");
        }

        record.AttemptCount++;
        if (!OtpHasher.Verify(code, record.CodeHash, _otpSettings.HashSecret))
        {
            await _codeRepository.UpdateAsync(record);
            var remaining = _otpSettings.MaxAttempts - record.AttemptCount;
            return (false, $"Geçersiz kod. Kalan deneme: {remaining}");
        }

        record.IsUsed = true;
        await _codeRepository.UpdateAsync(record);
        return (true, "Telefon numarası doğrulandı.");
    }
}
