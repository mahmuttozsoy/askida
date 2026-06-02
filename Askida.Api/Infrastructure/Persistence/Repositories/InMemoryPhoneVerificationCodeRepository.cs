using System.Collections.Concurrent;
using Askida.Api.Application.Interfaces;
using Askida.Api.Domain.Entities;

namespace Askida.Api.Infrastructure.Persistence.Repositories;

public class InMemoryPhoneVerificationCodeRepository : IPhoneVerificationCodeRepository
{
    private static readonly ConcurrentDictionary<string, List<PhoneVerificationCode>> Store = new();

    public Task InvalidateActiveCodesAsync(string phoneNumber)
    {
        if (Store.TryGetValue(phoneNumber, out var list))
        {
            foreach (var code in list.Where(c => !c.IsUsed && c.ExpiresAt > DateTime.UtcNow))
            {
                code.IsUsed = true;
            }
        }
        return Task.CompletedTask;
    }

    public Task AddAsync(PhoneVerificationCode code)
    {
        Store.AddOrUpdate(
            code.PhoneNumber,
            _ => new List<PhoneVerificationCode> { code },
            (_, list) =>
            {
                list.Add(code);
                return list;
            });
        return Task.CompletedTask;
    }

    public Task<PhoneVerificationCode?> GetActiveCodeAsync(string phoneNumber)
    {
        if (Store.TryGetValue(phoneNumber, out var list))
        {
            return Task.FromResult(list
                .Where(c => !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefault());
        }
        return Task.FromResult<PhoneVerificationCode?>(null);
    }

    public Task UpdateAsync(PhoneVerificationCode code)
    {
        return Task.CompletedTask;
    }
}
