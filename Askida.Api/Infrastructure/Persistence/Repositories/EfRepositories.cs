using Askida.Api.Application.Interfaces;
using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Askida.Api.Domain.Entities;
using Askida.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Askida.Api.Infrastructure.Persistence.Repositories;

public class PhoneVerificationCodeRepository : IPhoneVerificationCodeRepository
{
    private readonly AskidaDbContext _context;

    public PhoneVerificationCodeRepository(AskidaDbContext context)
    {
        _context = context;
    }

    public async Task InvalidateActiveCodesAsync(string phoneNumber)
    {
        var active = await _context.PhoneVerificationCodes
            .Where(c => c.PhoneNumber == phoneNumber && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var code in active)
        {
            code.IsUsed = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task AddAsync(PhoneVerificationCode code)
    {
        _context.PhoneVerificationCodes.Add(code);
        await _context.SaveChangesAsync();
    }

    public Task<PhoneVerificationCode?> GetActiveCodeAsync(string phoneNumber)
    {
        return _context.PhoneVerificationCodes
            .Where(c => c.PhoneNumber == phoneNumber && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(PhoneVerificationCode code)
    {
        _context.PhoneVerificationCodes.Update(code);
        await _context.SaveChangesAsync();
    }
}

public class EfUserRepository : IUserRepository
{
    private readonly AskidaDbContext _context;

    public EfUserRepository(AskidaDbContext context)
    {
        _context = context;
    }

    public async Task<User> AddAsync(User entity)
    {
        entity.Id = Guid.NewGuid().ToString();
        entity.CreatedAt = DateTime.UtcNow;
        _context.Users.Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task DeleteAsync(string id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    public Task<IEnumerable<User>> GetAllAsync()
    {
        return Task.FromResult(_context.Users.AsEnumerable());
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public Task<User?> GetByPhoneAsync(string phone)
    {
        return _context.Users.FirstOrDefaultAsync(u => u.Phone == phone);
    }

    public Task<User?> GetByIdAsync(string id)
    {
        return _context.Users.FindAsync(id).AsTask();
    }

    public async Task UpdateAsync(User entity)
    {
        _context.Users.Update(entity);
        await _context.SaveChangesAsync();
    }
}
