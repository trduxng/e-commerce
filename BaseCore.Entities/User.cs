using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace BaseCore.Entities
{
    public class User
    {
        public long Id { get; set; }

        public string Email { get; set; } = "";

        public string Password { get; set; } = "";

        public string? Phone { get; set; }

        public string Name { get; set; } = "";

        public string? Image { get; set; }

        public string Role { get; set; } = "customer";

        public string Status { get; set; } = "unverified";

        public DateTime? EmailVerifiedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        public DateTime Created { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [NotMapped]
        public string UserName
        {
            get => Email;
            set => Email = value;
        }

        [NotMapped]
        public byte[]? Salt { get; set; }

        [NotMapped]
        public string? Contact { get; set; }

        [NotMapped]
        public string? Position { get; set; }

        [NotMapped]
        public bool IsActive
        {
            get => Status == "active";
            set => Status = value ? "active" : "banned";
        }

        [NotMapped]
        public int UserType
        {
            get => Role == "admin" ? 1 : Role == "staff" ? 2 : 0;
            set => Role = value == 1 ? "admin" : value == 2 ? "staff" : "customer";
        }
    }
}
