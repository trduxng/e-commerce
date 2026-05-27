using System;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class FavoriteProduct
    {
        public long Id { get; set; }

        public long UserId { get; set; }

        public long ProductId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [JsonIgnore]
        public User? User { get; set; }

        public Product? Product { get; set; }
    }
}
