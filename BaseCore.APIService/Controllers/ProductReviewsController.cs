using System.Security.Claims;
using BaseCore.Entities;
using BaseCore.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [Route("api/products/{productId:long}/reviews")]
    [ApiController]
    public class ProductReviewsController : ControllerBase
    {
        private readonly SQLServerDbContext _db;

        public ProductReviewsController(SQLServerDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get(long productId)
        {
            if (!await ProductExists(productId))
                return NotFound(new { message = "Product not found" });

            var currentUserId = TryGetCurrentUserId(out var userId) ? userId : (long?)null;
            return Ok(await BuildResponse(productId, currentUserId));
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Upsert(long productId, [FromBody] SaveProductReviewDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            if (!await ProductExists(productId))
                return NotFound(new { message = "Product not found" });

            var content = dto.Content?.Trim();
            var title = dto.Title?.Trim();
            if (dto.Rating is < 1 or > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });
            if (string.IsNullOrWhiteSpace(content))
                return BadRequest(new { message = "Review content is required." });
            if (content.Length > 2000)
                return BadRequest(new { message = "Review content cannot exceed 2000 characters." });
            if (title?.Length > 150)
                return BadRequest(new { message = "Review title cannot exceed 150 characters." });

            var billDetail = await _db.OrderDetails
                .Include(detail => detail.Order)
                .Include(detail => detail.ProductVariant)
                .Where(detail =>
                    detail.Order != null &&
                    detail.Order.UserId == userId &&
                    detail.Order.OrderStatus.ToLower() == "delivered" &&
                    detail.ProductVariant != null &&
                    detail.ProductVariant.ProductId == productId)
                .OrderByDescending(detail => detail.Order!.CreatedAt)
                .FirstOrDefaultAsync();

            if (billDetail == null)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only customers who bought and received this product can write a review." });

            var review = await _db.Reviews.FirstOrDefaultAsync(item =>
                item.UserId == userId &&
                item.ProductId == productId);

            if (review == null)
            {
                review = new Review
                {
                    UserId = userId,
                    ProductId = productId,
                    CreatedAt = DateTime.Now
                };
                _db.Reviews.Add(review);
            }

            review.BillDetailId = billDetail?.Id;
            review.Rating = dto.Rating;
            review.Title = string.IsNullOrWhiteSpace(title) ? null : title;
            review.Content = content;
            review.IsVerifiedPurchase = billDetail != null;
            review.Status = "approved";

            await _db.SaveChangesAsync();
            return Ok(await BuildResponse(productId, userId));
        }

        private async Task<ProductReviewResponseDto> BuildResponse(long productId, long? currentUserId = null)
        {
            var reviews = await _db.Reviews
                .Where(review => review.ProductId == productId && review.Status == "approved")
                .Include(review => review.User)
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new ProductReviewItemDto
                {
                    Id = review.Id,
                    Rating = review.Rating,
                    Title = review.Title,
                    Content = review.Content ?? "",
                    IsVerifiedPurchase = review.IsVerifiedPurchase,
                    HelpfulCount = review.HelpfulCount,
                    CreatedAt = review.CreatedAt,
                    ReviewerName = review.User != null ? review.User.Name : "Customer"
                })
                .ToListAsync();

            var totalCount = reviews.Count;
            var breakdown = Enumerable.Range(1, 5)
                .Reverse()
                .Select(stars =>
                {
                    var count = reviews.Count(review => review.Rating == stars);
                    return new ProductReviewBreakdownDto
                    {
                        Stars = stars,
                        Count = count,
                        Percentage = totalCount == 0 ? 0 : Math.Round(count * 100m / totalCount, 1)
                    };
                })
                .ToList();

            var canWriteReview = currentUserId.HasValue && await HasDeliveredPurchase(currentUserId.Value, productId);

            return new ProductReviewResponseDto
            {
                AverageRating = totalCount == 0 ? 0 : Math.Round(reviews.Average(review => (decimal)review.Rating), 1),
                TotalCount = totalCount,
                Breakdown = breakdown,
                Items = reviews,
                CanWriteReview = canWriteReview,
                ReviewEligibilityMessage = canWriteReview
                    ? ""
                    : "Only customers who bought and received this product can write a review."
            };
        }

        private Task<bool> HasDeliveredPurchase(long userId, long productId)
        {
            return _db.OrderDetails.AnyAsync(detail =>
                detail.Order != null &&
                detail.Order.UserId == userId &&
                detail.Order.OrderStatus.ToLower() == "delivered" &&
                detail.ProductVariant != null &&
                detail.ProductVariant.ProductId == productId);
        }

        private Task<bool> ProductExists(long productId)
        {
            return _db.Products.AnyAsync(product =>
                product.Id == productId &&
                product.DeletedAt == null &&
                product.IsActive);
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }
    }

    public class SaveProductReviewDto
    {
        public byte Rating { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
    }

    public class ProductReviewResponseDto
    {
        public decimal AverageRating { get; set; }
        public int TotalCount { get; set; }
        public List<ProductReviewBreakdownDto> Breakdown { get; set; } = new();
        public List<ProductReviewItemDto> Items { get; set; } = new();
        public bool CanWriteReview { get; set; }
        public string ReviewEligibilityMessage { get; set; } = "";
    }

    public class ProductReviewBreakdownDto
    {
        public int Stars { get; set; }
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class ProductReviewItemDto
    {
        public long Id { get; set; }
        public byte Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = "";
        public string ReviewerName { get; set; } = "";
        public bool IsVerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
