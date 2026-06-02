using Askida.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace Askida.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(FakeDataStore.Categories);
        }
    }
}
