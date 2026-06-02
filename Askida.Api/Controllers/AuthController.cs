using Microsoft.AspNetCore.Mvc;
using Askida.Api.Application.Interfaces;
using Askida.Api.Core.DTOs;
using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Askida.Api.Infrastructure.Security;
using Askida.Api.Infrastructure.Services;

namespace Askida.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IPhoneVerificationService _phoneVerificationService;
    private readonly IOTPService _otpService;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(
        IPhoneVerificationService phoneVerificationService,
        IOTPService otpService,
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService)
    {
        _phoneVerificationService = phoneVerificationService;
        _otpService = otpService;
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOTP([FromBody] SendOTPRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new AuthResponse(false, "Telefon numarası gerekli."));
            }

            var result = await _phoneVerificationService.SendVerificationCodeAsync(request.Phone, request.AllowExisting);
            if (!result.Success)
            {
                return BadRequest(new AuthResponse(false, result.Message));
            }

            return Ok(new AuthResponse(true, result.Message, new { devOtp = result.DevOtp }));
        }
        catch (Exception ex)
        {
            return BadRequest(new AuthResponse(false, $"Hata: {ex.Message}"));
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOTP([FromBody] VerifyOTPRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new AuthResponse(false, "Telefon numarası gerekli."));
        }

        var result = await _phoneVerificationService.VerifyOtpAsync(request.Phone, request.Code);
        return result.Success
            ? Ok(new AuthResponse(true, result.Message))
            : BadRequest(new AuthResponse(false, result.Message));
    }

    [HttpPost("resend-otp")]
    public Task<IActionResult> ResendOTP([FromBody] SendOTPRequest request) => SendOTP(request);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new AuthResponse(false, "Telefon numarası gerekli."));
        }

        var normalizedPhone = PhoneNormalizer.Normalize(request.Phone) ?? request.Phone.Trim();

        var existingUser = await _userRepository.GetByPhoneAsync(normalizedPhone);
        if (existingUser != null)
        {
            return BadRequest(new AuthResponse(false, "Bu telefon numarası zaten kullanımda."));
        }

        var isStudent = string.Equals(request.Role, "Student", StringComparison.OrdinalIgnoreCase);
        var newUser = new User
        {
            Email = request.Email?.Trim() ?? $"{normalizedPhone}@askida.com",
            Phone = normalizedPhone,
            PasswordHash = PasswordHasher.Hash(request.Password),
            FullName = request.Name,
            Role = request.Role,
            PhoneVerified = true,
            VerificationStatus = isStudent ? "None" : "Verified"
        };

        await _userRepository.AddAsync(newUser);

        return Ok(new AuthResponse(true, "Kayıt başarılı.", new
        {
            newUser.Id,
            newUser.Email,
            newUser.Phone,
            newUser.FullName,
            newUser.Role
        }));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        User? user = null;
        var normalizedPhone = PhoneNormalizer.Normalize(request.Phone);

        if (!string.IsNullOrWhiteSpace(normalizedPhone))
        {
            user = await _userRepository.GetByPhoneAsync(normalizedPhone);
        }
        else if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user = await _userRepository.GetByEmailAsync(request.Email.Trim());
        }

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return BadRequest(new AuthResponse(false, "Kullanıcı bulunamadı veya şifre hatalı."));
        }

        var token = _jwtTokenService.GenerateToken(user.Id, user.Email, user.Role);
        return Ok(new AuthResponse(true, "Giriş başarılı.", new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                user.Phone,
                user.FullName,
                user.Role
            }
        }));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new AuthResponse(false, "Telefon numarası gerekli."));
        }

        var result = await _phoneVerificationService.VerifyOtpAsync(request.Phone, request.Code);
        if (!result.Success)
        {
            return BadRequest(new AuthResponse(false, result.Message));
        }

        var normalizedPhone = PhoneNormalizer.Normalize(request.Phone) ?? request.Phone.Trim();
        var user = await _userRepository.GetByPhoneAsync(normalizedPhone);
        if (user == null)
        {
            return BadRequest(new AuthResponse(false, "Kullanıcı bulunamadı."));
        }

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        await _userRepository.UpdateAsync(user);

        return Ok(new AuthResponse(true, "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."));
    }

    private static bool VerifyPassword(string password, string hash)
    {
        if (string.IsNullOrEmpty(hash))
        {
            return false;
        }

        if (hash.StartsWith("$2"))
        {
            return PasswordHasher.Verify(password, hash);
        }

        var legacyHash = Convert.ToBase64String(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(password)));
        return legacyHash == hash;
    }
}
