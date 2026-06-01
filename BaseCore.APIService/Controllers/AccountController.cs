using BaseCore.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/account")]
    [ApiController]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly SQLServerDbContext _db;

        public AccountController(SQLServerDbContext db)
        {
            _db = db;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var orders = _db.Orders.Where(order => order.UserId == userId);
            return Ok(new
            {
                totalOrders = await orders.CountAsync(),
                totalSpent = await orders
                    .Where(order => order.OrderStatus == "delivered")
                    .SumAsync(order => (decimal?)order.TotalAmount) ?? 0,
                favoriteProducts = await _db.FavoriteProducts.CountAsync(item => item.UserId == userId),
            });
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var profile = await _db.Users
                .Where(user => user.Id == userId && user.DeletedAt == null)
                .Select(user => new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Phone,
                    avatarUrl = user.Image,
                })
                .FirstOrDefaultAsync();

            return profile == null ? NotFound(new { message = "Account not found" }) : Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Full name is required." });

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required." });

            var email = dto.Email.Trim().ToLowerInvariant();
            var emailExists = await _db.Users.AnyAsync(user => user.Id != userId && user.Email == email);
            if (emailExists)
                return Conflict(new { message = "Email is already in use." });

            var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId && item.DeletedAt == null);
            if (user == null)
                return NotFound(new { message = "Account not found" });

            user.Name = dto.Name.Trim();
            user.Email = email;
            user.Phone = dto.Phone?.Trim();
            user.Image = dto.AvatarUrl?.Trim();
            user.UpdatedAt = DateTime.Now;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                avatarUrl = user.Image,
            });
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }
    }

    public class UpdateProfileDto
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
