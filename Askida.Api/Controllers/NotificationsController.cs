using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;

namespace Askida.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationsController(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var notifs = await _notificationRepository.GetByUserIdAsync(userId);
            return Ok(notifs);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var notif = await _notificationRepository.GetByIdAsync(id);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            await _notificationRepository.UpdateAsync(notif);
            return Ok(new { success = true });
        }

        [HttpPost("user/{userId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(string userId)
        {
            var notifs = await _notificationRepository.GetByUserIdAsync(userId);
            foreach (var notif in notifs.Where(n => !n.IsRead))
            {
                notif.IsRead = true;
                await _notificationRepository.UpdateAsync(notif);
            }
            return Ok(new { success = true });
        }
    }
}
