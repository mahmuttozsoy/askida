namespace Askida.Api.Application.Interfaces;

public interface IPhoneVerificationCodeRepository
{
    Task InvalidateActiveCodesAsync(string phoneNumber);
    Task AddAsync(Domain.Entities.PhoneVerificationCode code);
    Task<Domain.Entities.PhoneVerificationCode?> GetActiveCodeAsync(string phoneNumber);
    Task UpdateAsync(Domain.Entities.PhoneVerificationCode code);
}
