using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class CartItem
    {
        public long Id { get; set; }

        public long CartId { get; set; }

        public long ProductVariantId { get; set; }

        public int Quantity { get; set; }

        public decimal PriceSnapshot { get; set; }

        public string? ProductNameSnapshot { get; set; }

        public string? ImageUrlSnapshot { get; set; }

        public string? SkuSnapshot { get; set; }

        public string? SizeSnapshot { get; set; }

        public string? ColorSnapshot { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [JsonIgnore]
        public Cart? Cart { get; set; }

        public ProductVariant? ProductVariant { get; set; }

        [NotMapped]
        public long ProductId => ProductVariant?.ProductId ?? 0;
    }
}
