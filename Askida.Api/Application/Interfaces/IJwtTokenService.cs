namespace Askida.Api.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(string userId, string email, string role);
}
