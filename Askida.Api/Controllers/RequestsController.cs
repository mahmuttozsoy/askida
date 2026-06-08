using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Askida.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly IAidRepository _aidRepository;
    private readonly IUserRepository _userRepository;

    public RequestsController(IAidRepository aidRepository, IUserRepository userRepository)
    {
        _aidRepository = aidRepository;
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var aids = await _aidRepository.GetAllAsync();
        var users = await _userRepository.GetAllAsync();

        // Sadece öğrencilerin talep ettiklerini filtrele
        var requests = aids.Where(a => !string.IsNullOrEmpty(a.ClaimerId) && a.Status != "Available");

        var mapped = requests.Select(a => {
            var student = users.FirstOrDefault(u => u.Id == a.ClaimerId);
            var creator = users.FirstOrDefault(u => u.Id == a.CreatorId);
            var sName = student?.FullName ?? "Bilinmiyor";

            return new
            {
                id = a.Id,
                studentName = sName,
                productName = a.Title,
                status = a.Status == "Claimed" ? "Pending" : a.Status,
                createdAt = a.CreatedAt.ToString("dd.MM.yyyy HH:mm"),
                
                title = a.Title,
                description = a.Description,
                categoryId = a.CategoryId,
                creatorId = a.CreatorId,
                price = a.Price,
                location = a.Location,
                quantity = a.Quantity,
                remainingQuantity = a.RemainingQuantity,
                claimerId = a.ClaimerId,
                parentId = a.ParentId
            };
        });

        return Ok(mapped);
    }

    [HttpPost]
    public async Task<IActionResult> Claim([FromBody] RequestClaimDto dto)
    {
        var originalAid = await _aidRepository.GetByIdAsync(dto.ProductId);
        if (originalAid == null) return NotFound(new { success = false, message = "İlan bulunamadı." });

        // NOT: Kullanıcının "bir öğrenci onay/ret gelene kadar ikinci bir talep yapamasın" isteği üzerine
        // öğrencinin hali hazırda onay/red bekleyen ("Claimed") aktif bir talebi var mı kontrol ediliyor.
        var existingAids = await _aidRepository.GetByClaimerIdAsync(dto.ClaimerId);
        if (existingAids.Any(a => a.Status == "Claimed"))
        {
            return BadRequest(new { success = false, message = "Zaten bekleyen bir talebiniz var. Lütfen sonuçlanmasını bekleyin." });
        }
        // Kullanıcının istediği mantık: Talep edildiğinde stok düşmez, Admin onaylayınca düşer!
        // Bu yüzden orijinal ilanın status'ünü Available bırakıyoruz. Öğrenci için yeni bir talep (Aid kaydı) açıyoruz.

        var requestAid = new Aid
        {
            Id = Guid.NewGuid().ToString(),
            Title = originalAid.Title,
            Description = originalAid.Description,
            CategoryId = originalAid.CategoryId,
            CreatorId = originalAid.CreatorId,
            ClaimerId = dto.ClaimerId,
            Price = originalAid.Price,
            Location = originalAid.Location,
            Status = "Claimed", // Admin panelinde Pending görünecek
            Quantity = 1,
            RemainingQuantity = 0,
            ParentId = originalAid.Id,
            CreatedAt = DateTime.UtcNow
        };

        await _aidRepository.AddAsync(requestAid);
        return Ok(new { success = true, message = "Talebiniz alındı. Onay bekleniyor." });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveRequest(string id)
    {
        var requestAid = await _aidRepository.GetByIdAsync(id);
        if (requestAid == null) return NotFound(new { success = false, message = "Talep bulunamadı." });

        if (!string.IsNullOrEmpty(requestAid.ParentId))
        {
            var parentAid = await _aidRepository.GetByIdAsync(requestAid.ParentId);
            // Onay sırasında stok kontrolü yap
            if (parentAid == null || parentAid.RemainingQuantity <= 0)
            {
                return BadRequest(new { success = false, message = "Havuzda bu ürün için uygun bir bağış bulunmuyor. Teslimat için önce bağış yapılması gereklidir." });
            }

            // Stoktan düş
            parentAid.RemainingQuantity -= 1;
            // Kullanıcının istediği üzere: Ürün (menü öğesi) stok 0'ın altına düşse de (negatif veya sıfır) 
            // hiçbir zaman "Completed" olmaz, hep feed'de "Available" olarak kalır.
            await _aidRepository.UpdateAsync(parentAid);
        }

        requestAid.Status = "Completed";
        await _aidRepository.UpdateAsync(requestAid);

        return Ok(new { success = true, message = "Talep onaylandı ve teslim edildi." });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRequest(string id)
    {
        var requestAid = await _aidRepository.GetByIdAsync(id);
        if (requestAid == null) return NotFound(new { success = false, message = "Talep bulunamadı." });

        requestAid.Status = "Cancelled";
        await _aidRepository.UpdateAsync(requestAid);

        return Ok(new { success = true, message = "Talep reddedildi." });
    }
}

public class RequestClaimDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ClaimerId { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string CreatedAt { get; set; } = string.Empty;
}
