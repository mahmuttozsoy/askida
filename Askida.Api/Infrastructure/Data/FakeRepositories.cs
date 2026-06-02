using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using System.IO;
using System.Text.Json;

namespace Askida.Api.Infrastructure.Data
{
    public static class FakeDataStore
    {
        private static readonly string FilePath = "data_store.json";

        static FakeDataStore()
        {
            LoadData();
        }

        public static List<User> Users { get; set; } = new List<User>();
        public static List<Aid> Aids { get; set; } = new List<Aid>();
        public static List<Notification> Notifications { get; set; } = new List<Notification>();
        public static List<Category> Categories { get; set; } = new List<Category>
        {
            new Category { Id = "cat-yemek", Name = "Yemek", Icon = "restaurant" },
            new Category { Id = "cat-barinma", Name = "Barınma", Icon = "home" },
            new Category { Id = "cat-kirtasiye", Name = "Kırtasiye", Icon = "menu_book" }
        };

        public static void SaveData()
        {
            try
            {
                var data = new FakeStoreDataDto { Users = Users, Aids = Aids, Notifications = Notifications };
                var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(FilePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving data to JSON: {ex.Message}");
            }
        }

        public static void LoadData()
        {
            try
            {
                if (File.Exists(FilePath))
                {
                    var json = File.ReadAllText(FilePath);
                    var data = JsonSerializer.Deserialize<FakeStoreDataDto>(json);
                    if (data != null)
                    {
                        Users = data.Users ?? new List<User>();
                        Aids = data.Aids ?? new List<Aid>();
                        Notifications = data.Notifications ?? new List<Notification>();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading data from JSON: {ex.Message}");
            }

            // Ensure Admin exists
            if (!Users.Any(u => u.Role == "Admin"))
            {
                Users.Add(new User
                {
                    Id = "admin-id",
                    FullName = "Sistem Yöneticisi",
                    Email = "admin@askida.org",
                    PasswordHash = "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=", // SHA256 base64 for "admin"
                    Role = "Admin",
                    VerificationStatus = "Verified",
                    CreatedAt = DateTime.UtcNow
                });
                SaveData();
            }
        }

        private class FakeStoreDataDto
        {
            public List<User>? Users { get; set; }
            public List<Aid>? Aids { get; set; }
            public List<Notification>? Notifications { get; set; }
        }
    }

    public class FakeUserRepository : IUserRepository
    {
        public Task<User> AddAsync(User entity)
        {
            entity.Id = Guid.NewGuid().ToString();
            entity.CreatedAt = DateTime.UtcNow;
            FakeDataStore.Users.Add(entity);
            FakeDataStore.SaveData();
            return Task.FromResult(entity);
        }

        public Task DeleteAsync(string id)
        {
            var user = FakeDataStore.Users.FirstOrDefault(u => u.Id == id);
            if (user != null)
            {
                FakeDataStore.Users.Remove(user);
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }

        public Task<IEnumerable<User>> GetAllAsync()
        {
            return Task.FromResult(FakeDataStore.Users.AsEnumerable());
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            return Task.FromResult(FakeDataStore.Users.FirstOrDefault(u => u.Email == email));
        }

        public Task<User?> GetByPhoneAsync(string phone)
        {
            return Task.FromResult(FakeDataStore.Users.FirstOrDefault(u => u.Phone == phone));
        }

        public Task<User?> GetByIdAsync(string id)
        {
            return Task.FromResult(FakeDataStore.Users.FirstOrDefault(u => u.Id == id));
        }

        public Task UpdateAsync(User entity)
        {
            var user = FakeDataStore.Users.FirstOrDefault(u => u.Id == entity.Id);
            if (user != null)
            {
                user.FullName = entity.FullName;
                user.Role = entity.Role;
                user.Phone = entity.Phone;
                user.PhoneVerified = entity.PhoneVerified;
                user.VerificationStatus = entity.VerificationStatus;
                user.VerificationDocumentUrl = entity.VerificationDocumentUrl;
                user.StudentCategory = entity.StudentCategory;
                user.SchoolName = entity.SchoolName;
                user.Grade = entity.Grade;
                user.FcmToken = entity.FcmToken;
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }
    }

    public class FakeAidRepository : IAidRepository
    {
        public Task<Aid> AddAsync(Aid entity)
        {
            if (string.IsNullOrEmpty(entity.Id))
                entity.Id = Guid.NewGuid().ToString();

            entity.CreatedAt = DateTime.UtcNow;
            FakeDataStore.Aids.Add(entity);
            FakeDataStore.SaveData();
            return Task.FromResult(entity);
        }

        public Task DeleteAsync(string id)
        {
            var aid = FakeDataStore.Aids.FirstOrDefault(a => a.Id == id);
            if (aid != null)
            {
                FakeDataStore.Aids.Remove(aid);
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Aid>> GetAllAsync()
        {
            return Task.FromResult(FakeDataStore.Aids.AsEnumerable());
        }

        public Task<IEnumerable<Aid>> GetByCategoryIdAsync(string categoryId)
        {
            return Task.FromResult(FakeDataStore.Aids.Where(a => a.CategoryId == categoryId).AsEnumerable());
        }

        public Task<Aid?> GetByIdAsync(string id)
        {
            return Task.FromResult(FakeDataStore.Aids.FirstOrDefault(a => a.Id == id));
        }

        public Task<IEnumerable<Aid>> GetByCreatorIdAsync(string creatorId)
        {
            return Task.FromResult(FakeDataStore.Aids.Where(a => a.CreatorId == creatorId).AsEnumerable());
        }

        public Task<IEnumerable<Aid>> GetByClaimerIdAsync(string claimerId)
        {
            return Task.FromResult(FakeDataStore.Aids.Where(a => a.ClaimerId == claimerId).AsEnumerable());
        }

        public Task UpdateAsync(Aid entity)
        {
            var aid = FakeDataStore.Aids.FirstOrDefault(a => a.Id == entity.Id);
            if (aid != null)
            {
                aid.Title = entity.Title;
                aid.Description = entity.Description;
                aid.Status = entity.Status;
                aid.ClaimerId = entity.ClaimerId;
                aid.Price = entity.Price;
                aid.Location = entity.Location;
                aid.Quantity = entity.Quantity;
                aid.RemainingQuantity = entity.RemainingQuantity;
                aid.ParentId = entity.ParentId;
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }
    }

    public class FakeNotificationRepository : INotificationRepository
    {
        public Task<Notification> AddAsync(Notification entity)
        {
            if (string.IsNullOrEmpty(entity.Id))
                entity.Id = Guid.NewGuid().ToString();

            entity.CreatedAt = DateTime.UtcNow;
            FakeDataStore.Notifications.Add(entity);
            FakeDataStore.SaveData();
            return Task.FromResult(entity);
        }

        public Task DeleteAsync(string id)
        {
            var notif = FakeDataStore.Notifications.FirstOrDefault(n => n.Id == id);
            if (notif != null)
            {
                FakeDataStore.Notifications.Remove(notif);
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Notification>> GetAllAsync()
        {
            return Task.FromResult(FakeDataStore.Notifications.AsEnumerable());
        }

        public Task<Notification?> GetByIdAsync(string id)
        {
            return Task.FromResult(FakeDataStore.Notifications.FirstOrDefault(n => n.Id == id));
        }

        public Task<IEnumerable<Notification>> GetByUserIdAsync(string userId)
        {
            return Task.FromResult(FakeDataStore.Notifications.Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt).AsEnumerable());
        }

        public Task UpdateAsync(Notification entity)
        {
            var notif = FakeDataStore.Notifications.FirstOrDefault(n => n.Id == entity.Id);
            if (notif != null)
            {
                notif.IsRead = entity.IsRead;
                FakeDataStore.SaveData();
            }
            return Task.CompletedTask;
        }
    }
}
