using System.Text;
using Askida.Api.Application.Interfaces;
using Askida.Api.Core.Interfaces;
using Askida.Api.Core.Models;
using Askida.Api.Infrastructure.Data;
using Askida.Api.Infrastructure.Persistence;
using Askida.Api.Infrastructure.Persistence.Repositories;
using Askida.Api.Infrastructure.Security;
using Askida.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using Askida.Api.Infrastructure.Cache;

// C# (ASP.NET Core) uygulamasının ANA GİRİŞ NOKTASI.
// Sunucu çalışmaya başladığında ilk bu dosya okunur. Servisler, bağımlılıklar (Dependency Injection) ve Middleware'ler burada ayarlanır.
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<OtpSettings>(builder.Configuration.GetSection("OtpSettings"));
builder.Services.Configure<WhatsAppSettings>(builder.Configuration.GetSection("WhatsAppSettings"));

var usePostgreSql = builder.Configuration.GetValue("Infrastructure:UsePostgreSql", false);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// UYGULAMA YAPILANDIRMASI (DI - Dependency Injection)
// Veritabanı seçimi yapılır: Eğer UsePostgreSql aktifse ve şifre girilmişse Gerçek Veritabanı (PostgreSQL) kullanılır.
if (usePostgreSql && !string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<AskidaDbContext>(options =>
        options.UseNpgsql(connectionString));
    builder.Services.AddScoped<IUserRepository, EfUserRepository>();
    builder.Services.AddScoped<IAidRepository, EfAidRepository>();
}
else
{
    // Aksi halde verileri RAM'de tutan veya sahte JSON okuyan geçici test veritabanları (FakeRepository) kullanılır.
    builder.Services.AddSingleton<IUserRepository, FakeUserRepository>();
    builder.Services.AddSingleton<IAidRepository, FakeAidRepository>();
}

builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
builder.Services.AddSingleton<IOTPService, OTPService>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<INotificationRepository, FakeNotificationRepository>();
builder.Services.AddSingleton<IWhatsAppService, WhatsAppBusinessService>();
builder.Services.AddSingleton<IOtpRateLimitService>(sp => new RedisOtpRateLimitService(null, sp.GetRequiredService<IConfiguration>()));
builder.Services.AddSingleton<IPhoneVerificationCodeRepository, InMemoryPhoneVerificationCodeRepository>();
builder.Services.AddSingleton<IPhoneVerificationService, PhoneVerificationService>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// EĞER POSTGRESQL KULLANILIYORSA, uygulama başlarken tabloların otomatik olarak oluşturulmasını sağlar.
if (usePostgreSql && !string.IsNullOrWhiteSpace(connectionString))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AskidaDbContext>();
    db.Database.EnsureCreated();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
