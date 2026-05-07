using System;

namespace BaseCore.Entities
{
    // NHÓM reviews
    public class Review
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long ProductId { get; set; }
        public long BillDetailId { get; set; }
        public byte Rating { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public bool IsVerifiedPurchase { get; set; } = true;
        public int HelpfulCount { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // NHÓM promotions
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; } = "";
        public string Type { get; set; } = ""; // percent, fixed, free_ship
        public decimal Value { get; set; }
        public decimal MinOrderValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // NHÓM payment
    public class PaymentTransaction
    {
        public long Id { get; set; }
        public long BillId { get; set; }
        public string Gateway { get; set; } = ""; // vnpay, momo
        public string? TransactionCode { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "pending";
        public string? GatewayResponse { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class Shipment
    {
        public long Id { get; set; }
        public long BillId { get; set; }
        public string Carrier { get; set; } = "";
        public string? TrackingCode { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime? EstimatedDelivery { get; set; }
        public decimal? CarrierFee { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }
}
