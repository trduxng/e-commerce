using System.ComponentModel.DataAnnotations;
using System;

namespace BaseCore.Common
{
    public class Entity
    {
        [Key]
        public int Id { get; set; }

        public DateTime CreatedDateTime { get; set; } = DateTime.Now;
        public string CreatedUser { get; set; }
    }
}
