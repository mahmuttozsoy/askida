namespace Askida.Api.Core.Interfaces;

public interface IOTPService
{
    string GenerateOTP(string identifier);
    bool VerifyOTP(string identifier, string code);
    void RemoveOTP(string identifier);
}
