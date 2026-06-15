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
            var query = _context.Carts
                .Include(c => c.User)
                .Include(c => c.Items)
                    .ThenInclude(i => i.ProductVariant)
                        .ThenInclude(v => v.Product)
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
                    User = new { c.User.Id, c.User.Name, c.User.Email },
                    ItemCount = c.Items.Count,
                    TotalValue = c.Items.Sum(i => (i.ProductVariant.SalePrice ?? i.ProductVariant.Price) * i.Quantity),
                    Items = c.Items.Select(i => new {
                        i.Id,
                        ProductName = i.ProductVariant.Product.Name,
                        i.ProductVariant.Size,
                        i.ProductVariant.Color,
                        i.Quantity,
                        Price = i.ProductVariant.SalePrice ?? i.ProductVariant.Price
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
