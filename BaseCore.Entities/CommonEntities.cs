using System;

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
}
