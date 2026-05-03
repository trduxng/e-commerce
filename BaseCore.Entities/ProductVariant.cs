using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class ProductVariant
    {
        public long Id { get; set; }

        public long ProductId { get; set; }

        public string? Size { get; set; }

        public string? Color { get; set; }

        public string Sku { get; set; } = "";

        public decimal Price { get; set; }

        public decimal? SalePrice { get; set; }

        public int StockQuantity { get; set; }

        public int? WeightGram { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public Product? Product { get; set; }
    }
}
