namespace Askida.Api.Application.Interfaces;

public interface IOtpRateLimitService
{
    Task<(bool Allowed, string? ErrorMessage)> CanSendOtpAsync(string phoneNumber);
    Task RecordOtpSentAsync(string phoneNumber);
}
