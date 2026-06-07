using Askida.Api.Application.DTOs;
using Askida.Api.Core.Entities;
using Askida.Api.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Askida.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonationsController : ControllerBase
{
    private readonly IAidRepository _aidRepository;

    public DonationsController(IAidRepository aidRepository)
    {
        _aidRepository = aidRepository;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAidDto dto)
    {
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
}
