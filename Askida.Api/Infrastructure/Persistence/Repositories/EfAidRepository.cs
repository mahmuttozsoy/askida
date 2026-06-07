using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Askida.Api.Infrastructure.Persistence.Repositories;

/// <summary>
/// PostgreSQL Veritabanı ile İlan/Yardım (Aid) objelerinin haberleştiği katman.
/// Entity Framework Core kullanılarak veritabanında okuma/yazma (CRUD) işlemleri burada yapılır.
/// </summary>
public class EfAidRepository : IAidRepository
{
    private readonly AskidaDbContext _context;

    public EfAidRepository(AskidaDbContext context)
    {
        _context = context;
    }

    public async Task<Aid> AddAsync(Aid entity)
    {
        // Yeni bir ilan eklenirken ID'si yoksa otomatik oluşturulur.
        if (string.IsNullOrEmpty(entity.Id))
            entity.Id = Guid.NewGuid().ToString();

        entity.CreatedAt = DateTime.UtcNow;
        _context.Aids.Add(entity); // Veriyi RAM'e (Context) ekler
        await _context.SaveChangesAsync(); // Değişiklikleri PostgreSQL'e kaydeder
        return entity;
    }

    public async Task DeleteAsync(string id)
    {
        // İlanı veritabanından kalıcı olarak siler
        var aid = await _context.Aids.FindAsync(id);
        if (aid != null)
        {
            _context.Aids.Remove(aid);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<Aid>> GetAllAsync()
    {
        return await _context.Aids.ToListAsync();
    }

    public async Task<IEnumerable<Aid>> GetByCategoryIdAsync(string categoryId)
    {
        return await _context.Aids.Where(a => a.CategoryId == categoryId).ToListAsync();
    }

    public async Task<Aid?> GetByIdAsync(string id)
    {
        return await _context.Aids.FindAsync(id);
    }

    public async Task<IEnumerable<Aid>> GetByCreatorIdAsync(string creatorId)
    {
        return await _context.Aids.Where(a => a.CreatorId == creatorId).ToListAsync();
    }

    public async Task<IEnumerable<Aid>> GetByClaimerIdAsync(string claimerId)
    {
        return await _context.Aids.Where(a => a.ClaimerId == claimerId).ToListAsync();
    }

    public async Task UpdateAsync(Aid entity)
    {
        _context.Aids.Update(entity);
        await _context.SaveChangesAsync();
    }
}
