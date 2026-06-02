namespace Askida.Api.Core.Interfaces;

public interface IWhatsAppService
{
    bool IsConfigured { get; }
    Task SendOTPAsync(string phoneNumber, string otpCode);
    Task SendVerificationCodeAsync(string phoneNumber, string code);
}
