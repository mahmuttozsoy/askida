using Askida.Api.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Askida.Api.Core.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T?> GetByIdAsync(string id);
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(string id);
    }

    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByPhoneAsync(string phone);
    }

    public interface IAidRepository : IRepository<Aid>
    {
        Task<IEnumerable<Aid>> GetByCategoryIdAsync(string categoryId);
        Task<IEnumerable<Aid>> GetByCreatorIdAsync(string creatorId);
        Task<IEnumerable<Aid>> GetByClaimerIdAsync(string claimerId);
    }

    public interface INotificationRepository : IRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetByUserIdAsync(string userId);
    }
}
