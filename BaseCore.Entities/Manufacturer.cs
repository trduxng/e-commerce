using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Manufacturer
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";

        public string? Description { get; set; }

        public string? PictureUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [JsonIgnore]
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}