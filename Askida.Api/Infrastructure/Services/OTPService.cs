using System.Collections.Concurrent;
using Askida.Api.Core.Interfaces;

namespace Askida.Api.Infrastructure.Services;

public class OTPService : IOTPService
{
    private static readonly ConcurrentDictionary<string, OTPInfo> _otpStorage = new();
    private readonly TimeSpan _expirationTime = TimeSpan.FromMinutes(5);

    public string GenerateOTP(string identifier)
    {
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();

        var otpInfo = new OTPInfo
        {
            Code = code,
            ExpiryTime = DateTime.UtcNow.Add(_expirationTime)
        };

        _otpStorage.AddOrUpdate(identifier, otpInfo, (_, _) => otpInfo);
        return code;
    }

    public bool VerifyOTP(string identifier, string code)
    {
        if (_otpStorage.TryGetValue(identifier, out var otpInfo))
        {
            if (otpInfo.ExpiryTime > DateTime.UtcNow && otpInfo.Code == code)
            {
                return true;
            }
        }
        return false;
    }

    public void RemoveOTP(string identifier)
    {
        _otpStorage.TryRemove(identifier, out _);
    }

    private class OTPInfo
    {
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
    }
}
