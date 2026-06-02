using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.IO;
using System;
using Microsoft.AspNetCore.Http;

namespace Askida.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _userRepository.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] User user)
        {
            user.Id = id;
            await _userRepository.UpdateAsync(user);
            return NoContent();
        }

        [HttpPut("{id}/fcm-token")]
        public async Task<IActionResult> UpdateFcmToken(string id, [FromBody] FcmTokenUpdateRequest request)
        {
            var targetUser = await _userRepository.GetByIdAsync(id);
            if (targetUser == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            targetUser.FcmToken = request.Token ?? string.Empty;
            await _userRepository.UpdateAsync(targetUser);
            return Ok(new { success = true, message = "FCM token başarıyla güncellendi." });
        }

        [HttpPost("{id}/upload-document")]
        public async Task<IActionResult> UploadDocument(string id, IFormFile file)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "Geçersiz dosya." });

            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var extension = Path.GetExtension(file.FileName);
                // Clean user name from spaces and special characters for a clean file name
                var cleanName = user.FullName;
                foreach (char c in Path.GetInvalidFileNameChars())
                {
                    cleanName = cleanName.Replace(c.ToString(), "");
                }
                cleanName = cleanName.Replace(" ", "_").ToLower();
                
                var uniqueFileName = $"{cleanName}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Add ticks parameter for browser cache busting
                var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}?t={DateTime.UtcNow.Ticks}";
                
                user.VerificationStatus = "Pending";
                user.VerificationDocumentUrl = fileUrl;
                
                await _userRepository.UpdateAsync(user);

                return Ok(new { success = true, message = "Belge başarıyla yüklendi. Onay süreci başladı.", documentUrl = fileUrl, user = user });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Hata oluştu: {ex.Message}" });
            }
        }

        [HttpGet("{id}/download-document")]
        public async Task<IActionResult> DownloadDocument(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            var url = user.VerificationDocumentUrl;
            if (string.IsNullOrEmpty(url)) return NotFound(new { success = false, message = "Kullanıcıya ait öğrenci belgesi bulunamadı." });

            string filename = "";
            var uploadsMarker = "/uploads/";
            var markerIndex = url.IndexOf(uploadsMarker, StringComparison.OrdinalIgnoreCase);
            if (markerIndex != -1)
            {
                filename = url.Substring(markerIndex + uploadsMarker.Length);
                var queryIndex = filename.IndexOf('?');
                if (queryIndex != -1)
                {
                    filename = filename.Substring(0, queryIndex);
                }
            }
            else
            {
                try
                {
                    var uri = new Uri(url);
                    filename = Path.GetFileName(uri.AbsolutePath);
                }
                catch
                {
                    return BadRequest(new { success = false, message = "Belge yolu çözümlenemedi." });
                }
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            var filePath = Path.Combine(uploadsFolder, filename);

            if (!System.IO.File.Exists(filePath))
                return NotFound(new { success = false, message = "Fiziksel dosya sunucuda bulunamadı." });

            var extension = Path.GetExtension(filePath);
            var cleanName = user.FullName;
            foreach (char c in Path.GetInvalidFileNameChars())
            {
                cleanName = cleanName.Replace(c.ToString(), "");
            }
            cleanName = cleanName.Replace(" ", "_").ToLower();
            var downloadName = $"{cleanName}{extension}";

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType, downloadName);
        }

        [HttpGet("{id}/view-document")]
        public async Task<IActionResult> ViewDocument(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            var url = user.VerificationDocumentUrl;
            if (string.IsNullOrEmpty(url)) return NotFound(new { success = false, message = "Kullanıcıya ait öğrenci belgesi bulunamadı." });

            string filename = "";
            var uploadsMarker = "/uploads/";
            var markerIndex = url.IndexOf(uploadsMarker, StringComparison.OrdinalIgnoreCase);
            if (markerIndex != -1)
            {
                filename = url.Substring(markerIndex + uploadsMarker.Length);
                var queryIndex = filename.IndexOf('?');
                if (queryIndex != -1)
                {
                    filename = filename.Substring(0, queryIndex);
                }
            }
            else
            {
                try
                {
                    var uri = new Uri(url);
                    filename = Path.GetFileName(uri.AbsolutePath);
                }
                catch
                {
                    return BadRequest(new { success = false, message = "Belge yolu çözümlenemedi." });
                }
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            var filePath = Path.Combine(uploadsFolder, filename);

            if (!System.IO.File.Exists(filePath))
                return NotFound(new { success = false, message = "Fiziksel dosya sunucuda bulunamadı." });

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, contentType);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveVerification(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            user.VerificationStatus = "Verified";
            await _userRepository.UpdateAsync(user);

            return Ok(new { success = true, message = "Kullanıcı başarıyla onaylandı.", user = user });
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectVerification(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            user.VerificationStatus = "Rejected";
            await _userRepository.UpdateAsync(user);

            return Ok(new { success = true, message = "Kullanıcı belgesi reddedildi.", user = user });
        }

        [HttpPost("{id}/verify-student")]
        public async Task<IActionResult> VerifyStudent(string id, [FromForm] StudentVerificationRequest request, [FromServices] IEmailService emailService)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            string fileUrl = user.VerificationDocumentUrl;
            if (request.File != null && request.File.Length > 0)
            {
                try
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    var extension = Path.GetExtension(request.File.FileName);
                    var cleanName = user.FullName;
                    foreach (char c in Path.GetInvalidFileNameChars())
                    {
                        cleanName = cleanName.Replace(c.ToString(), "");
                    }
                    cleanName = cleanName.Replace(" ", "_").ToLower();
                    
                    var uniqueFileName = $"{cleanName}_document{extension}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.File.CopyToAsync(fileStream);
                    }

                    fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}?t={DateTime.UtcNow.Ticks}";
                }
                catch (Exception ex)
                {
                    return BadRequest(new { success = false, message = $"Dosya yüklenirken hata oluştu: {ex.Message}" });
                }
            }

            if (!string.IsNullOrEmpty(request.FullName))
            {
                user.FullName = request.FullName.Trim();
            }
            if (!string.IsNullOrEmpty(request.Phone))
            {
                user.Phone = request.Phone.Trim();
            }
            if (!string.IsNullOrEmpty(request.Email))
            {
                user.Email = request.Email.Trim();
            }

            user.VerificationStatus = "Pending";
            user.VerificationDocumentUrl = fileUrl;
            user.StudentCategory = request.StudentCategory ?? string.Empty;
            user.SchoolName = request.SchoolName ?? string.Empty;
            user.Grade = request.Grade ?? string.Empty;

            await _userRepository.UpdateAsync(user);

            // Send Email to mahmutsinaa@gmail.com
            try
            {
                var emailSubject = $"Öğrenci Doğrulama Talebi - {user.FullName} ({user.StudentCategory})";
                var emailBody = $@"
                    <h3>Yeni Öğrenci Doğrulama Başvurusu</h3>
                    <p><b>Öğrenci Adı Soyadı:</b> {user.FullName}</p>
                    <p><b>Telefon:</b> {user.Phone}</p>
                    <p><b>E-posta:</b> {user.Email}</p>
                    <p><b>Eğitim Kademesi:</b> {user.StudentCategory}</p>
                    <p><b>Okul Adı:</b> {user.SchoolName}</p>
                    <p><b>Sınıf/Şube/Bölüm:</b> {user.Grade}</p>
                ";

                if (!string.IsNullOrEmpty(fileUrl))
                {
                    emailBody += $"<p><b>Yüklenen Belge:</b> <a href='{fileUrl}'>Belgeyi Görüntüle</a></p>";
                }

                emailBody += "<hr/><p>Bu e-posta sistem tarafından otomatik olarak gönderilmiştir. Lütfen yönetici panelinden onaylama veya reddetme işlemini gerçekleştirin.</p>";

                _ = Task.Run(() => emailService.SendEmailAsync("mahmutsinaa@gmail.com", emailSubject, emailBody));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email send failed: {ex.Message}");
            }

            return Ok(new { success = true, message = "Doğrulama talebi başarıyla alındı ve mahmutsinaa@gmail.com adresine e-posta gönderildi.", user = user });
        }

        [HttpPost("{id}/unverify")]
        public async Task<IActionResult> UnverifyVerification(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            user.VerificationStatus = "None";
            await _userRepository.UpdateAsync(user);

            return Ok(new { success = true, message = "Kullanıcı doğrulama durumu sıfırlandı (Onaysız yapıldı).", user = user });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { success = false, message = "Kullanıcı bulunamadı." });

            await _userRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Kullanıcı başarıyla silindi." });
        }
    }

    public class StudentVerificationRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? StudentCategory { get; set; }
        public string? SchoolName { get; set; }
        public string? Grade { get; set; }
        public IFormFile? File { get; set; }
    }

    public class FcmTokenUpdateRequest
    {
        public string? Token { get; set; }
    }
}
