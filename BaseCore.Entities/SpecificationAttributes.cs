using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class SpecificationAttribute
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<ProductSpecification> ProductSpecifications { get; set; } = new List<ProductSpecification>();
    }

    public class ProductSpecification
    {
        public long Id { get; set; }
        public long ProductId { get; set; }
        public int SpecificationAttributeId { get; set; }
        public string Value { get; set; } = ""; // e.g., "16GB", "Intel i7"
        public int SortOrder { get; set; }

        public Product? Product { get; set; }
        public SpecificationAttribute? SpecificationAttribute { get; set; }
    }
}
