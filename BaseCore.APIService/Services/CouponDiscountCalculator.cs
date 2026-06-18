using BaseCore.Entities;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Services
{
    public static class CouponDiscountCalculator
    {
        public static async Task<CouponApplicationResult> ApplyAsync(
            SQLServerDbContext db,
            string? couponCode,
            decimal orderValue,
            bool requireCode = false)
        {
            // Dùng chung cho API xem trước và hai luồng tạo đơn để tránh lệch cách tính.
            var code = couponCode?.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                return requireCode
                    ? new CouponApplicationResult { ErrorMessage = "Coupon code is required" }
                    : new CouponApplicationResult();
            }

            var normalizedCode = code.ToLower();
            var coupon = await db.Coupons.FirstOrDefaultAsync(item => item.Code.ToLower() == normalizedCode);
            if (coupon == null || !coupon.IsActive || coupon.StartDate > DateTime.Now || coupon.EndDate < DateTime.Now)
            {
                return new CouponApplicationResult { ErrorMessage = "Invalid or expired coupon code" };
            }

            if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
            {
                return new CouponApplicationResult { ErrorMessage = "Coupon usage limit reached" };
            }

            if (orderValue < coupon.MinOrderValue)
            {
                return new CouponApplicationResult { ErrorMessage = $"Minimum order value of {coupon.MinOrderValue} required" };
            }

            return new CouponApplicationResult
            {
                Coupon = coupon,
                Code = coupon.Code,
                DiscountAmount = Calculate(coupon, orderValue)
            };
        }

        public static decimal Calculate(Coupon coupon, decimal orderValue)
        {
            if (orderValue <= 0)
                return 0;

            var discount = coupon.Type?.Trim().ToLowerInvariant() switch
            {
                "fixed" => coupon.Value,
                "percent" => orderValue * coupon.Value / 100m,
                _ => 0
            };

            // Giới hạn trần giảm giá và không bao giờ giảm vượt quá giá trị đơn.
            if (coupon.MaxDiscountAmount.HasValue && coupon.MaxDiscountAmount.Value > 0)
                discount = Math.Min(discount, coupon.MaxDiscountAmount.Value);

            if (discount < 0)
                return 0;

            return Math.Min(discount, orderValue);
        }
    }

    public class CouponApplicationResult
    {
        public Coupon? Coupon { get; set; }
        public string? Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
