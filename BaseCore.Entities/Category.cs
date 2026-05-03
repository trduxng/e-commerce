using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Category
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";

        public string Slug { get; set; } = "";

        public string? Description { get; set; }

        public int? ParentId { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; }

        [JsonIgnore]
        public Category? Parent { get; set; }

        [JsonIgnore]
        public List<Product> Products { get; set; } = new();
    }
}
