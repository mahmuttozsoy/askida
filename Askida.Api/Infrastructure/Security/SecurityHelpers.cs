namespace Askida.Api.Infrastructure.Security;

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Askida.Api.Core.Models;

public static class OtpHasher
{
    public static string Hash(string code, string secret)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{secret}:{code}"));
        return Convert.ToBase64String(bytes);
    }

    public static bool Verify(string code, string hash, string secret)
    {
        return Hash(code, secret) == hash;
    }
}

public class PasswordHasher
{
    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public static bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
