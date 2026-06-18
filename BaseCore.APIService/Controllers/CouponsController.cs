using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.APIService.Services;

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
            var validationMessage = NormalizeCoupon(coupon);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            if (await _context.Coupons.AnyAsync(c => c.Code.ToLower() == coupon.Code.ToLower()))
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
            var existing = await _context.Coupons.FindAsync(id);
            if (existing == null)
                return NotFound();

            coupon.Id = id;
            var validationMessage = NormalizeCoupon(coupon);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            if (await _context.Coupons.AnyAsync(c => c.Id != id && c.Code.ToLower() == coupon.Code.ToLower()))
                return BadRequest(new { message = "Coupon code already exists" });

            existing.Code = coupon.Code;
            existing.Type = coupon.Type;
            existing.Value = coupon.Value;
            existing.MinOrderValue = coupon.MinOrderValue;
            existing.MaxDiscountAmount = coupon.MaxDiscountAmount;
            existing.UsageLimit = coupon.UsageLimit;
            existing.StartDate = coupon.StartDate;
            existing.EndDate = coupon.EndDate;
            existing.IsActive = coupon.IsActive;

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
            var couponApplication = await CouponDiscountCalculator.ApplyAsync(_context, dto.Code, dto.OrderValue, requireCode: true);
            if (couponApplication.ErrorMessage != null)
                return BadRequest(new { message = couponApplication.ErrorMessage });

            return Ok(new
            {
                couponId = couponApplication.Coupon!.Id,
                code = couponApplication.Code,
                discountAmount = couponApplication.DiscountAmount
            });
        }

        private bool CouponExists(int id)
        {
            return _context.Coupons.Any(e => e.Id == id);
        }

        private static string? NormalizeCoupon(Coupon coupon)
        {
            coupon.Code = coupon.Code?.Trim().ToUpperInvariant() ?? "";
            if (string.IsNullOrWhiteSpace(coupon.Code))
                return "Coupon code is required";

            coupon.Type = coupon.Type?.Trim().ToLowerInvariant() ?? "";
            if (coupon.Type is not ("percent" or "fixed"))
                return "Coupon type must be percent or fixed";

            if (coupon.Value <= 0)
                return "Coupon value must be greater than zero";

            if (coupon.Type == "percent" && coupon.Value > 100)
                return "Percent coupon value cannot exceed 100";

            if (coupon.MinOrderValue < 0)
                return "Minimum order value cannot be negative";

            if (coupon.MaxDiscountAmount.HasValue && coupon.MaxDiscountAmount.Value <= 0)
                coupon.MaxDiscountAmount = null;

            if (coupon.UsageLimit.HasValue && coupon.UsageLimit.Value <= 0)
                coupon.UsageLimit = null;

            if (coupon.EndDate == default || coupon.StartDate == default)
                return "Start date and end date are required";

            coupon.StartDate = coupon.StartDate.Date;
            coupon.EndDate = coupon.EndDate.Date.AddDays(1).AddTicks(-1);

            if (coupon.EndDate < coupon.StartDate)
                return "End date must be after start date";

            coupon.UsedCount = Math.Max(0, coupon.UsedCount);
            return null;
        }
    }

    public class ApplyCouponDto
    {
        public string Code { get; set; } = "";
        public decimal OrderValue { get; set; }
    }
}
