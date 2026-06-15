using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Order
    {
        public long Id { get; set; }

        public string OrderCode { get; set; } = "";

        public long? UserId { get; set; }

        public string? GuestEmail { get; set; }

        public string ReceiverName { get; set; } = "";

        public string ReceiverPhone { get; set; } = "";

        public string ShippingAddressFull { get; set; } = "";

        public decimal Subtotal { get; set; }

        public decimal ShippingFee { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; } = "cod";

        public string PaymentStatus { get; set; } = "pending";

        public string OrderStatus { get; set; } = "pending";

        public string? CouponCode { get; set; }

        public string? Note { get; set; }

        public string? CancelledReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [JsonIgnore]
        public User? User { get; set; }

        public List<OrderDetail> OrderDetails { get; set; } = new();

        [NotMapped]
        public DateTime OrderDate
        {
            get => CreatedAt;
            set
            {
                CreatedAt = value;
                UpdatedAt = value;
            }
        }

        [NotMapped]
        public string Status
        {
            get => OrderStatus;
            set => OrderStatus = NormalizeStatus(value);
        }

        [NotMapped]
        public string ShippingAddress
        {
            get => ShippingAddressFull;
            set => ShippingAddressFull = value;
        }

        private static string NormalizeStatus(string? status)
        {
            return status?.ToLowerInvariant() switch
            {
                "completed" or "delivered" => "delivered",
                "cancelled" => "cancelled",
                "shipping" => "shipping",
                "confirmed" => "confirmed",
                "return_requested" => "return_requested",
                "returned" => "returned",
                "refunded" => "refunded",
                _ => "pending"
            };
        }
    }
}
