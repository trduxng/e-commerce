using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class OrderDetail
    {
        public long Id { get; set; }

        public long OrderId { get; set; }

        public long ProductVariantId { get; set; }

        public string ProductNameSnapshot { get; set; } = "";

        public string? SizeSnapshot { get; set; }

        public string? ColorSnapshot { get; set; }

        public string SkuSnapshot { get; set; } = "";

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice { get; set; }

        [JsonIgnore]
        public Order? Order { get; set; }

        public ProductVariant? ProductVariant { get; set; }

        [NotMapped]
        public long ProductId
        {
            get => ProductVariant?.ProductId ?? 0;
            set { }
        }

        [NotMapped]
        [JsonIgnore]
        public Product? Product => ProductVariant?.Product;

        [NotMapped]
        public string? ProductImageUrl => ProductVariant?.ImageUrl ?? ProductVariant?.Product?.ImageUrl;

        [NotMapped]
        public bool IsReviewed { get; set; }

        [NotMapped]
        public long? ReviewId { get; set; }
    }
}
