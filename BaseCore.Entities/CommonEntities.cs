using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace BaseCore.Entities
{
    public class Supplier
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string Country { get; set; } = "Vietnam";
        public string Status { get; set; } = "active";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class Collection
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Slug { get; set; } = "";
        public string? Description { get; set; }
        public string? BannerUrl { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class Cart
    {
        public long Id { get; set; }
        public long? UserId { get; set; }
        public string? SessionToken { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        public System.Collections.Generic.List<CartItem> Items { get; set; } = new();
    }

    public class CartItem
    {
        public long Id { get; set; }
        public long CartId { get; set; }
        public long ProductVariantId { get; set; }
        public int Quantity { get; set; }
        public decimal PriceSnapshot { get; set; }
        public ProductVariant? ProductVariant { get; set; }
    }
}
