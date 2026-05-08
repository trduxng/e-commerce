using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Cart
    {
        public long Id { get; set; }

        public long UserId { get; set; }

        public string? SessionToken { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [JsonIgnore]
        public User? User { get; set; }

        public List<CartItem> Items { get; set; } = new();
    }
}
