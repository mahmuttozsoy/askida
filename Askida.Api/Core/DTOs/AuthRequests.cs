namespace Askida.Api.Core.DTOs;

public record RegisterRequest(string? Email, string? Phone, string Password, string Name, string Role = "Student");
public record LoginRequest(string? Email, string? Phone, string Password, string Role);
public record SendOTPRequest(string? Email, string? Phone, bool AllowExisting = false);
public record VerifyOTPRequest(string? Email, string? Phone, string Code);
public record ResetPasswordRequest(string Phone, string Code, string NewPassword);
public record AuthResponse(bool Success, string Message, object? Data = null);
