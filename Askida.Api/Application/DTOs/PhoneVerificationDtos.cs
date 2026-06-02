namespace Askida.Api.Application.DTOs;

public record SendPhoneCodeRequest(string PhoneNumber);
public record VerifyPhoneCodeRequest(string PhoneNumber, string Code);
public record RegisterWithPhoneRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    string Code,
    string Role = "Student");

public record PhoneVerificationResponse(bool Success, string Message, object? Data = null);

public record AuthTokenResponse(
    bool Success,
    string Message,
    string? Token = null,
    object? User = null);
