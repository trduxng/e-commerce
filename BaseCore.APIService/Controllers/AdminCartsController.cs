using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminCartsController : ControllerBase
    {
        private readonly SQLServerDbContext _context;

        public AdminCartsController(SQLServerDbContext context)
        {
            _context = context;
        }

        // GET: api/AdminCarts
        [HttpGet]
        public async Task<ActionResult<object>> GetActiveCarts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            // Chỉ lấy giỏ còn item và tính giá trị theo giá variant hiện tại để admin theo dõi.
            var query = _context.Carts
                .Include(c => c.User)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                        .ThenInclude(v => v!.Product)
                .Where(c => c.Items.Any())
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.UpdatedAt,
                    User = c.User != null ? new { c.User.Id, c.User.Name, c.User.Email } : null,
                    ItemCount = c.Items.Count,
                    TotalValue = c.Items.Sum(i => (i.ProductVariant != null ? (i.ProductVariant.SalePrice ?? i.ProductVariant.Price) : 0) * i.Quantity),
                    Items = c.Items.Select(i => new {
                        i.Id,
                        ProductName = i.ProductVariant != null && i.ProductVariant.Product != null ? i.ProductVariant.Product.Name : "Unknown Product",
                        Size = i.ProductVariant != null ? i.ProductVariant.Size : null,
                        Color = i.ProductVariant != null ? i.ProductVariant.Color : null,
                        i.Quantity,
                        Price = i.ProductVariant != null ? (i.ProductVariant.SalePrice ?? i.ProductVariant.Price) : 0
                    })
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
    }
}
