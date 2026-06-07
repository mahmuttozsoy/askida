using Askida.Api.Application.DTOs;
using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using System;

namespace Askida.Api.Controllers
{
    /// <summary>
    /// Sistemin ANA kalbi olan Aids (İlanlar/Yardımlar) Yöneticisi.
    /// Öğrenciler ve işletmeler arasındaki tüm askıda yemek, eşya vb. yardımlaşma işlemleri buradan yönetilir.
    /// Yeni mimaride her türlü "ürün", "bağış" ve "talep" ortak olarak bu controller altından "Aid" modeliyle işlenir.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AidsController : ControllerBase
    {
        private readonly IAidRepository _aidRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly HttpClient _httpClient;

        public AidsController(IAidRepository aidRepository, INotificationRepository notificationRepository, IUserRepository userRepository, HttpClient httpClient)
        {
            _aidRepository = aidRepository;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _httpClient = httpClient;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Veritabanındaki (PostgreSQL) tüm aktif ilanları/yardımları çeker. Feed (Ana sayfa) ekranını besler.
            return Ok(await _aidRepository.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var aid = await _aidRepository.GetByIdAsync(id);
            if (aid == null) return NotFound();
            return Ok(aid);
        }

        [HttpGet("creator/{creatorId}")]
        public async Task<IActionResult> GetByCreator(string creatorId)
        {
            return Ok(await _aidRepository.GetByCreatorIdAsync(creatorId));
        }

        [HttpGet("claimer/{claimerId}")]
        public async Task<IActionResult> GetByClaimer(string claimerId)
        {
            return Ok(await _aidRepository.GetByClaimerIdAsync(claimerId));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAidDto dto)
        {
            // Yeni bir ilan eklendiğinde çalışır (İşletmeler veya destekçiler tarafından kullanılır)
            var aid = new Aid
            {
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                CreatorId = string.IsNullOrEmpty(dto.CreatorId) ? "mock-supporter-id" : dto.CreatorId,
                Price = dto.Price,
                Location = dto.Location,
                Status = "Available", // İlanın durumunu başlangıçta 'Müsait' yapar.
                Quantity = dto.Quantity > 0 ? dto.Quantity : 1, // Toplam miktar
                RemainingQuantity = dto.Quantity > 0 ? dto.Quantity : 1 // Kalan/Kullanılabilir miktar
            };
            
            var createdAid = await _aidRepository.AddAsync(aid);
            return CreatedAtAction(nameof(GetById), new { id = createdAid.Id }, createdAid);
        }

        [HttpPost("{id}/claim")]
        public async Task<IActionResult> Claim(string id, [FromQuery] string claimerId)
        {
            // Öğrenci "Bağış İste" butonuna bastığında bu metot tetiklenir.
            var aid = await _aidRepository.GetByIdAsync(id);
            if (aid == null) return NotFound();

            // Kullanıcı mantığı: Menüdeki ürünler tükenmiş olsa bile (RemainingQuantity <= 0) talep edilebilir.
            // Onay işlemi admin panelinden yapılacaktır. Ana ilan (menü ögesi) hep "Available" kalmalı.
            
            string finalClaimerId = string.IsNullOrEmpty(claimerId) ? "mock-student-id" : claimerId;

            // Sadece o öğrenciye özel 'alt/kopya' bir ilan (Talep) oluşturulur.
            // Ana ilanın stoğu veya statüsü değişmez.
            var portionAid = new Aid
            {
                Title = aid.Title,
                Description = aid.Description,
                CategoryId = aid.CategoryId,
                CreatorId = aid.CreatorId,
                ClaimerId = finalClaimerId,
                Price = aid.Price,
                Location = aid.Location,
                Status = "Claimed", // Admin panelinde Pending görünecek
                Quantity = 1,
                RemainingQuantity = 0,
                ParentId = aid.Id
            };

            var createdPortion = await _aidRepository.AddAsync(portionAid);

            // İşletmeye/Destekçiye öğrencinin talebi için bildirim (DB, Push, WhatsApp) gönderilir.
            var creatorNotification = new Notification
            {
                UserId = aid.CreatorId,
                Title = "Yeni İlan Talebi 🍽️",
                Message = $"'{aid.Title}' ilanınız bir öğrenci tarafından talep edildi. Onaylamak için lütfen kontrol edin."
            };
            await _notificationRepository.AddAsync(creatorNotification);
            await SendPushAndWhatsAppNotifications(aid.CreatorId, creatorNotification.Title, creatorNotification.Message);

            return Ok(createdPortion);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Aid aid)
        {
            aid.Id = id;
            var existingAid = await _aidRepository.GetByIdAsync(id);
            if (existingAid == null) return NotFound();

            // If this is a portion ad (has ParentId) and the status is being updated to "Available" (rejected by creator)
            if (!string.IsNullOrEmpty(aid.ParentId) && aid.Status == "Available")
            {
                var parent = await _aidRepository.GetByIdAsync(aid.ParentId);
                if (parent != null)
                {
                    parent.RemainingQuantity += 1;
                    if (parent.Status == "Claimed")
                    {
                        parent.Status = "Available";
                    }
                    await _aidRepository.UpdateAsync(parent);
                }
                
                // Set status of portion to "Cancelled" so it shows as rejected in student's feed
                aid.Status = "Cancelled";

                // Add rejected notification
                var studentNotification = new Notification
                {
                    UserId = existingAid.ClaimerId,
                    Title = "Talep Reddedildi ❌",
                    Message = $"Maalesef '{aid.Title}' ilan talebiniz onaylanmadı."
                };
                await _notificationRepository.AddAsync(studentNotification);
                await SendPushAndWhatsAppNotifications(existingAid.ClaimerId, studentNotification.Title, studentNotification.Message);
            }
            else if (aid.Status == "Completed" && existingAid.Status != "Completed")
            {
                // Add approved notification
                var studentNotification = new Notification
                {
                    UserId = existingAid.ClaimerId,
                    Title = "Talebiniz Onaylandı! 🎉",
                    Message = $"'{aid.Title}' ilan talebiniz destekçi tarafından onaylanmıştır. Afiyet olsun!"
                };
                await _notificationRepository.AddAsync(studentNotification);
                await SendPushAndWhatsAppNotifications(existingAid.ClaimerId, studentNotification.Title, studentNotification.Message);
            }
            else if (aid.Status == "Available" && existingAid.Status == "Claimed")
            {
                // Single person aid rejected
                var studentNotification = new Notification
                {
                    UserId = existingAid.ClaimerId,
                    Title = "Talep Reddedildi ❌",
                    Message = $"Maalesef '{aid.Title}' ilan talebiniz onaylanmadı."
                };
                await _notificationRepository.AddAsync(studentNotification);
                await SendPushAndWhatsAppNotifications(existingAid.ClaimerId, studentNotification.Title, studentNotification.Message);
            }

            await _aidRepository.UpdateAsync(aid);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _aidRepository.DeleteAsync(id);
            return NoContent();
        }

        private async Task SendPushAndWhatsAppNotifications(string recipientUserId, string title, string message)
        {
            try
            {
                var recipientUser = await _userRepository.GetByIdAsync(recipientUserId);
                if (recipientUser == null) return;

                // 1. Send WhatsApp via local gateway on port 3000 if user phone is available
                if (!string.IsNullOrEmpty(recipientUser.Phone))
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var payload = new { to = recipientUser.Phone, message = $"*Askıda Bildirim* 🔔\n\n*{title}*\n{message}" };
                            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                            var response = await _httpClient.PostAsync("http://localhost:3000/send", content);
                            if (response.IsSuccessStatusCode)
                            {
                                Console.WriteLine($"[Notifications] WhatsApp message sent successfully to {recipientUser.Phone}");
                            }
                            else
                            {
                                Console.WriteLine($"[Notifications] WhatsApp Gateway returned error: {response.StatusCode}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[Notifications] Error sending WhatsApp message: {ex.Message}");
                        }
                    });
                }

                // 2. Trigger FCM Push Notification if FcmToken is available
                if (!string.IsNullOrEmpty(recipientUser.FcmToken))
                {
                    _ = Task.Run(() =>
                    {
                        try
                        {
                            Console.WriteLine($"[Notifications] Push Notification simulated to token: {recipientUser.FcmToken}");
                            Console.WriteLine($"[Notifications] Title: {title}, Message: {message}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[Notifications] Error sending FCM push: {ex.Message}");
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notifications] General notification error: {ex.Message}");
            }
        }
    }
}
