using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    // NHÓM auth
    public class UserAddress
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string ReceiverName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Province { get; set; } = "";
        public string District { get; set; } = "";
        public string Ward { get; set; } = "";
        public string AddressDetail { get; set; } = "";
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class AdminLog
    {
        public long Id { get; set; }
        public long AdminId { get; set; }
        public string Action { get; set; } = "";
        public string TargetTable { get; set; } = "";
        public long TargetId { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // NHÓM catalog (bổ sung)
    public class ProductImage
    {
        public long Id { get; set; }
        public long ProductId { get; set; }
        public string ImageUrl { get; set; } = "";
        public string? AltText { get; set; }
        public int SortOrder { get; set; }
        public bool IsPrimary { get; set; }
    }

    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Slug { get; set; } = "";
    }

    // NHÓM orders (bổ sung)
    public class OrderStatusLog
    {
        public long Id { get; set; }
        public long BillId { get; set; }
        public string? FromStatus { get; set; }
        public string ToStatus { get; set; } = "";
        public string? Note { get; set; }
        public long CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
