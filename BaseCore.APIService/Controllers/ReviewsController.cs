using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly SQLServerDbContext _context;

        public ReviewsController(SQLServerDbContext context)
        {
            _context = context;
        }

        // GET: api/reviews
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> GetReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Product)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Title,
                    r.Content,
                    r.Status,
                    r.CreatedAt,
                    r.IsVerifiedPurchase,
                    User = new { r.User.Id, r.User.Name, r.User.Email },
                    Product = new { r.Product.Id, r.Product.Name, r.Product.ImageUrl }
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        // PATCH: api/reviews/5/status
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateReviewStatusDto dto)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            if (dto.Status != "approved" && dto.Status != "rejected" && dto.Status != "pending")
            {
                return BadRequest(new { message = "Invalid status" });
            }

            review.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(review);
        }
    }

    public class UpdateReviewStatusDto
    {
        public string Status { get; set; } = "";
    }
}
