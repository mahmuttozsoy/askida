using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Askida.Api.Core.Interfaces;
using Askida.Api.Core.Models;
using Microsoft.Extensions.Options;

namespace Askida.Api.Infrastructure.Services;

public class WhatsAppBusinessService : IWhatsAppService
{
    private readonly WhatsAppSettings _settings;
    private readonly IHttpClientFactory _httpClientFactory;

    public WhatsAppBusinessService(
        IOptions<WhatsAppSettings> settings,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _httpClientFactory = httpClientFactory;
    }

    public bool IsConfigured => true;

    public async Task SendOTPAsync(string phoneNumber, string otpCode)
    {
        await SendVerificationCodeAsync(phoneNumber, otpCode);
    }

    public async Task SendVerificationCodeAsync(string phoneNumber, string code)
    {
        var message = $"""
            Askıda Doğrulama Kodu

            Merhaba,

            Hesabınızı doğrulamak için kodunuz:

            {code}

            Bu kod 5 dakika boyunca geçerlidir.

            Eğer bu işlemi siz yapmadıysanız mesajı dikkate almayınız.
            """;

        try
        {
            var client = _httpClientFactory.CreateClient();
            var payload = new { to = phoneNumber, message = message };
            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("http://localhost:3000/send", content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[WhatsApp Gateway Error] Mesaj gönderilemedi: {error}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WhatsApp Gateway Exception] {ex.Message}");
        }
    }
}
