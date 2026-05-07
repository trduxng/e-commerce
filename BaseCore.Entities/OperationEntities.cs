using System;

namespace BaseCore.Entities
{
    // NHÓM operations
    public class Notification
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Type { get; set; } = "";
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public bool IsRead { get; set; }
        public string? Link { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class InventoryTransaction
    {
        public long Id { get; set; }
        public long ProductVariantId { get; set; }
        public string Type { get; set; } = ""; // import, export, adjustment, return
        public int QuantityChange { get; set; }
        public int StockBefore { get; set; }
        public int StockAfter { get; set; }
        public long? ReferenceId { get; set; }
        public string? Note { get; set; }
        public long CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class Banner
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = "";
        public string? LinkUrl { get; set; }
        public string? Title { get; set; }
        public string Position { get; set; } = "home_top";
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }
}
