using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Askida.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly IAidRepository _aidRepository;

    public RequestsController(IAidRepository aidRepository)
    {
        _aidRepository = aidRepository;
    }

    [HttpPost]
    public async Task<IActionResult> Claim([FromBody] RequestClaimDto dto)
    {
        var aid = await _aidRepository.GetByIdAsync(dto.ProductId);
        if (aid == null) return NotFound();

        if (aid.Status != "Available" || aid.RemainingQuantity <= 0)
            return BadRequest(new { Message = "İlan durumu uygun değil veya miktar yetersiz." });

        aid.ClaimerId = dto.ClaimerId;
        aid.Status = "Claimed";
        aid.RemainingQuantity -= 1;
        
        await _aidRepository.UpdateAsync(aid);
        return Ok(aid);
    }
}

public class RequestClaimDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ClaimerId { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string CreatedAt { get; set; } = string.Empty;
}
