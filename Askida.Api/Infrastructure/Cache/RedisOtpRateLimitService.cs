using Askida.Api.Application.Interfaces;
using StackExchange.Redis;

namespace Askida.Api.Infrastructure.Cache;

public class RedisOtpRateLimitService : IOtpRateLimitService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly int _cooldownSeconds;
    private readonly int _dailyLimit;
    private static readonly Dictionary<string, (DateTime LastSent, int DailyCount, string DayKey)> Fallback =
        new();

    public RedisOtpRateLimitService(IConnectionMultiplexer? redis, IConfiguration configuration)
    {
        _redis = redis;
        _cooldownSeconds = configuration.GetValue("OtpSettings:ResendCooldownSeconds", 60);
        _dailyLimit = configuration.GetValue("OtpSettings:DailyLimit", 10);
    }

    public async Task<(bool Allowed, string? ErrorMessage)> CanSendOtpAsync(string phoneNumber)
    {
        if (_redis != null)
        {
            var db = _redis.GetDatabase();
            if (await db.KeyExistsAsync(CooldownKey(phoneNumber)))
            {
                return (false, $"Yeni kod için {_cooldownSeconds} saniye bekleyin.");
            }

            var dailyKey = DailyKey(phoneNumber);
            var count = (int?)await db.StringGetAsync(dailyKey) ?? 0;
            if (count >= _dailyLimit)
            {
                return (false, "Günlük OTP limitine ulaşıldı. Yarın tekrar deneyin.");
            }

            return (true, null);
        }

        return CanSendFallback(phoneNumber);
    }

    public async Task RecordOtpSentAsync(string phoneNumber)
    {
        if (_redis != null)
        {
            var db = _redis.GetDatabase();
            await db.StringSetAsync(CooldownKey(phoneNumber), "1", TimeSpan.FromSeconds(_cooldownSeconds));
            var dailyKey = DailyKey(phoneNumber);
            await db.StringIncrementAsync(dailyKey);
            await db.KeyExpireAsync(dailyKey, TimeSpan.FromHours(24));
            return;
        }

        RecordFallback(phoneNumber);
        await Task.CompletedTask;
    }

    private (bool Allowed, string? ErrorMessage) CanSendFallback(string phoneNumber)
    {
        if (Fallback.TryGetValue(phoneNumber, out var entry))
        {
            if ((DateTime.UtcNow - entry.LastSent).TotalSeconds < _cooldownSeconds)
            {
                return (false, $"Yeni kod için {_cooldownSeconds} saniye bekleyin.");
            }

            var dayKey = DateTime.UtcNow.ToString("yyyyMMdd");
            if (entry.DayKey == dayKey && entry.DailyCount >= _dailyLimit)
            {
                return (false, "Günlük OTP limitine ulaşıldı. Yarın tekrar deneyin.");
            }
        }

        return (true, null);
    }

    private static void RecordFallback(string phoneNumber)
    {
        var dayKey = DateTime.UtcNow.ToString("yyyyMMdd");
        if (Fallback.TryGetValue(phoneNumber, out var entry) && entry.DayKey == dayKey)
        {
            Fallback[phoneNumber] = (DateTime.UtcNow, entry.DailyCount + 1, dayKey);
        }
        else
        {
            Fallback[phoneNumber] = (DateTime.UtcNow, 1, dayKey);
        }
    }

    private static string CooldownKey(string phone) => $"otp:cooldown:{phone}";
    private static string DailyKey(string phone) => $"otp:daily:{phone}:{DateTime.UtcNow:yyyyMMdd}";
}
