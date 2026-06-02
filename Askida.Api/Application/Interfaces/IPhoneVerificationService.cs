namespace Askida.Api.Application.Interfaces;

public interface IPhoneVerificationService
{
    Task<(bool Success, string Message, string? DevOtp)> SendVerificationCodeAsync(string phoneNumber, bool allowExisting = false);
    Task<(bool Success, string Message)> VerifyOtpAsync(string phoneNumber, string code);
    Task<(bool Success, string Message)> ConsumeOtpForRegistrationAsync(string phoneNumber, string code);
    string GenerateOtp();
}
