using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System.Security.Claims;
using BaseCore.Entities;

namespace BaseCore.APIService.Controllers
{
    [Route("api/favorites")]
    [ApiController]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly SQLServerDbContext _db;
        private readonly IProductRepositoryEF _productRepository;

        public FavoritesController(SQLServerDbContext db, IProductRepositoryEF productRepository)
        {
            _db = db;
            _productRepository = productRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyFavorites()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var favorites = await _db.FavoriteProducts
                .Include(item => item.Product)
                .ThenInclude(product => product!.ProductVariants)
                .Where(item =>
                    item.UserId == userId &&
                    item.Product != null &&
                    item.Product.DeletedAt == null &&
                    item.Product.IsActive)
                    .OrderByDescending(item => item.CreatedAt)
                    .Select(item => item.Product)
                    .ToListAsync();
            // Bổ sung rating/review count để response render được trực tiếp bằng ProductCard.
            await _productRepository.PopulateReviewSummariesAsync(favorites.OfType<Product>());
            return Ok(favorites);
        }

        [HttpGet("ids")]
        public async Task<IActionResult> GetMyFavoriteIds()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            var ids = await _db.FavoriteProducts
                .Where(item => item.UserId == userId)
                .Select(item => item.ProductId)
                .ToListAsync();
            return Ok(ids);

        }

        [HttpPost("{productId:long}")]
        public async Task<IActionResult> Add(long productId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var productExists = await _db.Products.AnyAsync(product =>
                product.Id == productId &&
                product.DeletedAt == null &&
                product.IsActive);
            if (!productExists)
                return NotFound(new { message = "Product not found" });
            // Thêm yêu thích là idempotent: gọi lặp lại vẫn trả thành công và không tạo bản ghi trùng.
            var alreadyExists = await _db.FavoriteProducts.AnyAsync(item =>
                item.UserId == userId &&
                item.ProductId == productId);
            if (alreadyExists)
                return Ok(new { message = "Product is already in favorites" });

            _db.FavoriteProducts.Add(new FavoriteProduct
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.Now
            });
            await _db.SaveChangesAsync();

            return Ok(new { message = "Product added to favorites" });
        }
        [HttpDelete("{productId:long}")]
        public async Task<IActionResult> Remove(long productId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            var favorite = await _db.FavoriteProducts.FirstOrDefaultAsync(item =>
                item.UserId == userId &&
                item.ProductId == productId);
            if (favorite != null)
            {
                _db.FavoriteProducts.Remove(favorite);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Product removed from favorites" });
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }



    }
}
