using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class CheckoutAttribute
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string ControlType { get; set; } = "DropdownList"; // DropdownList, RadioList, Checkboxes, TextBox
        public bool IsRequired { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<CheckoutAttributeValue> Values { get; set; } = new List<CheckoutAttributeValue>();
    }

    public class CheckoutAttributeValue
    {
        public int Id { get; set; }
        public int CheckoutAttributeId { get; set; }
        public string Name { get; set; } = "";
        public decimal PriceAdjustment { get; set; }
        public bool IsPreSelected { get; set; }
        public int SortOrder { get; set; }

        public CheckoutAttribute? CheckoutAttribute { get; set; }
    }
}
