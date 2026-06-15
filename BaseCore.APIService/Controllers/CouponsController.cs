using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly SQLServerDbContext _context;

        public CouponsController(SQLServerDbContext context)
        {
            _context = context;
        }

        // GET: api/coupons
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> GetCoupons([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? keyword = null)
        {
            var query = _context.Coupons.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                query = query.Where(c => c.Code.Contains(keyword));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.StartDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

        // POST: api/coupons
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<Coupon>> CreateCoupon(Coupon coupon)
        {
            if (await _context.Coupons.AnyAsync(c => c.Code == coupon.Code))
            {
                return BadRequest(new { message = "Coupon code already exists" });
            }

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCoupons), new { id = coupon.Id }, coupon);
        }

        // PUT: api/coupons/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateCoupon(int id, Coupon coupon)
        {
            if (id != coupon.Id)
            {
                return BadRequest();
            }

            _context.Entry(coupon).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CouponExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/coupons/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound();
            }

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/coupons/apply
        [HttpPost("apply")]
        [Authorize]
        public async Task<ActionResult<object>> ApplyCoupon([FromBody] ApplyCouponDto dto)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == dto.Code);

            if (coupon == null || !coupon.IsActive || coupon.StartDate > DateTime.Now || coupon.EndDate < DateTime.Now)
            {
                return BadRequest(new { message = "Invalid or expired coupon code" });
            }

            if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
            {
                return BadRequest(new { message = "Coupon usage limit reached" });
            }

            if (dto.OrderValue < coupon.MinOrderValue)
            {
                return BadRequest(new { message = $"Minimum order value of {coupon.MinOrderValue} required" });
            }

            decimal discountAmount = 0;
            if (coupon.Type == "fixed")
            {
                discountAmount = coupon.Value;
            }
            else if (coupon.Type == "percent")
            {
                discountAmount = dto.OrderValue * (coupon.Value / 100);
                if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
                {
                    discountAmount = coupon.MaxDiscountAmount.Value;
                }
            }

            return Ok(new
            {
                couponId = coupon.Id,
                code = coupon.Code,
                discountAmount = discountAmount
            });
        }

        private bool CouponExists(int id)
        {
            return _context.Coupons.Any(e => e.Id == id);
        }
    }

    public class ApplyCouponDto
    {
        public string Code { get; set; } = "";
        public decimal OrderValue { get; set; }
    }
}
