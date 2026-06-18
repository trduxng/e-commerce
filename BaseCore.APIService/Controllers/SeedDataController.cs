using BaseCore.APIService.Services;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedDataController : ControllerBase
    {
        private readonly IDatabaseSeeder _seeder;

        public SeedDataController(IDatabaseSeeder seeder)
        {
            _seeder = seeder;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromQuery] int users = 100, [FromQuery] int categories = 20, [FromQuery] int products = 300, [FromQuery] int orders = 200)
        {
            try
            {
                var result = await _seeder.SeedAllAsync(users, categories, products, orders);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error during seeding", details = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> Clear()
        {
            var success = await _seeder.ClearAllDataAsync();
            if (success) return Ok(new { message = "All seeded data has been cleared." });
            return StatusCode(500, new { message = "Error during clearing data." });
        }
    }
}
