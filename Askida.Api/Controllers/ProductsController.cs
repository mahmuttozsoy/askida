using Askida.Api.Application.DTOs;
using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Askida.Api.Controllers;

/// <summary>
/// Admin Panel Uyumluluk Yöneticisi (Geriye Dönük Uyumluluk)
/// Eski Admin Paneli kodları hala '/products' endpointine istek attığı için,
/// bu controller gelen istekleri yakalayıp yeni mimarinin kalbi olan 'IAidRepository' e yönlendirir.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IAidRepository _aidRepository;

    public ProductsController(IAidRepository aidRepository)
    {
        _aidRepository = aidRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Admin paneli tüm ürünleri listelemek istediğinde çalışır.
        return Ok(await _aidRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAidDto dto)
    {
        // Admin panelinden "Yeni Ürün Ekle" butonuna basıldığında çalışır.
        // Gelen ürün bilgisini yeni mimarideki "Aid" (Yardım/İlan) modeline dönüştürüp PostgreSQL'e kaydeder.
        var aid = new Aid
        {
            Title = dto.Title,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            CreatorId = string.IsNullOrEmpty(dto.CreatorId) ? "mock-supporter-id" : dto.CreatorId,
            Price = dto.Price,
            Location = dto.Location,
            Status = "Available",
            Quantity = dto.Quantity > 0 ? dto.Quantity : 1,
            RemainingQuantity = dto.Quantity > 0 ? dto.Quantity : 1
        };
        
        var createdAid = await _aidRepository.AddAsync(aid);
        return CreatedAtAction(nameof(GetById), new { id = createdAid.Id }, createdAid);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var aid = await _aidRepository.GetByIdAsync(id);
        if (aid == null) return NotFound();
        return Ok(aid);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Aid aid)
    {
        if (id != aid.Id) return BadRequest();
        await _aidRepository.UpdateAsync(aid);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _aidRepository.DeleteAsync(id);
        return NoContent();
    }
}
