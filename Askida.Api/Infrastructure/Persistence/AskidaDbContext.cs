using Askida.Api.Core.Entities;
using Askida.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Askida.Api.Infrastructure.Persistence;

public class AskidaDbContext : DbContext
{
    public AskidaDbContext(DbContextOptions<AskidaDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Aid> Aids => Set<Aid>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<PhoneVerificationCode> PhoneVerificationCodes => Set<PhoneVerificationCode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Phone);
            entity.Property(e => e.PhoneVerified).HasDefaultValue(false);
        });

        modelBuilder.Entity<PhoneVerificationCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PhoneNumber);
        });

        modelBuilder.Entity<Aid>().HasKey(e => e.Id);
        modelBuilder.Entity<Category>().HasKey(e => e.Id);
    }
}
