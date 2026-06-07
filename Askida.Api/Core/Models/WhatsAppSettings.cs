namespace Askida.Api.Core.Models;

public class WhatsAppSettings
{
    public string PhoneNumberId { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v21.0";
    public string GatewayUrl { get; set; } = "http://195.35.56.82:3000";
}
