namespace Askida.Api.Core.Models;

public class JwtSettings
{
    public string Secret { get; set; } = "AskidaSuperSecretKeyForDevelopmentOnlyChangeInProduction123!";
    public string Issuer { get; set; } = "Askida.Api";
    public string Audience { get; set; } = "Askida.App";
    public int ExpirationMinutes { get; set; } = 10080;
}

public class OtpSettings
{
    public int ExpirationMinutes { get; set; } = 5;
    public int MaxAttempts { get; set; } = 5;
    public int ResendCooldownSeconds { get; set; } = 60;
    public int DailyLimit { get; set; } = 10;
    public string HashSecret { get; set; } = "AskidaOtpHashSecretChangeInProduction";
}
