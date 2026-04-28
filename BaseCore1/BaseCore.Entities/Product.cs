using System;
using System.Collections.Generic;
using System.Linq;
using System.ComponentModel.DataAnnotations.Schema;

namespace BaseCore.Entities
{
    public class Product
    {
        public long Id { get; set; }

        public string Name { get; set; } = "";

        public string Slug { get; set; } = "";

        public int CategoryId { get; set; }

        public int? CollectionId { get; set; }

        public int? SupplierId { get; set; }

        public string? Description { get; set; }

        public string? ShortDescription { get; set; }

        public decimal BasePrice { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsFeatured { get; set; }

        public int SoldCount { get; set; }

        public int ViewCount { get; set; }

        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public Category? Category { get; set; }

        public List<ProductVariant> ProductVariants { get; set; } = new();

        [NotMapped]
        public decimal Price
        {
            get => ProductVariants.Count > 0
                ? ProductVariants.Min(v => v.SalePrice ?? v.Price)
                : BasePrice;
            set => BasePrice = value;
        }

        [NotMapped]
        public int Stock
        {
            get => ProductVariants.Sum(v => v.StockQuantity);
            set
            {
                if (ProductVariants.Count == 0)
                {
                    ProductVariants.Add(new ProductVariant
                    {
                        Price = BasePrice,
                        StockQuantity = value,
                        Sku = Guid.NewGuid().ToString("N")
                    });
                    return;
                }

                ProductVariants[0].StockQuantity = value;
            }
        }
    }
}
