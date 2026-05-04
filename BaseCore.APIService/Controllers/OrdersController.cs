using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Order API Controller
    /// Teaching: RESTful API, Business Logic, Authentication (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
        }

        /// <summary>
        /// Get orders for current user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            if (!TryGetCurrentUserId(out var userLongId))
                return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userLongId);
            return Ok(orders);
        }

        /// <summary>
        /// Get all orders (Admin only)
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders(
            [FromQuery] string? keyword,
            [FromQuery] string? status,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            if (page.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(keyword) || !string.IsNullOrWhiteSpace(status))
            {
                var safePage = Math.Max(1, page ?? 1);
                var safePageSize = Math.Clamp(pageSize ?? 10, 1, 100);
                var (items, totalCount, summary) = await _orderRepository.SearchAllWithDetailsAsync(keyword, status, safePage, safePageSize);

                return Ok(new
                {
                    items,
                    totalCount,
                    page = safePage,
                    pageSize = safePageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / safePageSize),
                    summary
                });
            }

            var orders = await _orderRepository.GetAllWithDetailsAsync();
            return Ok(orders);
        }

        /// <summary>
        /// Get order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var order = await _orderRepository.GetWithDetailsAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
            if (!CanAccessOrder(order)) return Forbid();

            return Ok(new { order, details = order.OrderDetails });
        }

        /// <summary>
        /// Create new order
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            if (!TryGetCurrentUserId(out var userLongId))
                return Unauthorized();

            if (dto.Items.Count == 0)
                return BadRequest(new { message = "Order must contain at least one item" });

            // Validate products and calculate total
            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest(new { message = "Quantity must be greater than zero" });

                var product = await _productRepository.GetProductWithVariantsAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });

                var variant = product.ProductVariants
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.Id)
                    .FirstOrDefault();

                if (variant == null)
                    return BadRequest(new { message = $"Product {product.Name} has no active variant" });

                if (variant.StockQuantity < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

                var unitPrice = variant.SalePrice ?? variant.Price;
                totalAmount += unitPrice * item.Quantity;
                orderDetails.Add(new OrderDetail
                {
                    ProductVariantId = variant.Id,
                    ProductNameSnapshot = product.Name,
                    SizeSnapshot = variant.Size,
                    ColorSnapshot = variant.Color,
                    SkuSnapshot = variant.Sku,
                    Quantity = item.Quantity,
                    UnitPrice = unitPrice,
                    TotalPrice = unitPrice * item.Quantity
                });

                variant.StockQuantity -= item.Quantity;
                product.SoldCount += item.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            var order = new Order
            {
                OrderCode = $"ORD-{DateTime.Now:yyyy}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                UserId = userLongId,
                GuestEmail = dto.Email,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                ReceiverName = dto.ReceiverName ?? "Customer",
                ReceiverPhone = dto.ReceiverPhone ?? "0000000000",
                ShippingAddressFull = dto.ShippingAddress ?? "",
                Subtotal = totalAmount,
                ShippingFee = Math.Max(0, dto.ShippingFee),
                DiscountAmount = Math.Max(0, dto.DiscountAmount),
                TaxAmount = Math.Max(0, dto.TaxAmount),
                TotalAmount = totalAmount + Math.Max(0, dto.ShippingFee) + Math.Max(0, dto.TaxAmount) - Math.Max(0, dto.DiscountAmount),
                PaymentMethod = dto.PaymentMethod ?? "cod",
                PaymentStatus = "pending",
                OrderStatus = "pending",
                CouponCode = dto.CouponCode,
                Note = dto.Note
            };

            await _orderRepository.AddAsync(order);

            // Add order details
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { order, details = orderDetails });
        }

        /// <summary>
        /// Update editable order information for the current user
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateOrderDto dto)
        {
            var order = await _orderRepository.GetWithDetailsAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
            if (!CanAccessOrder(order)) return Forbid();

            if (order.OrderStatus != "pending")
                return BadRequest(new { message = "Only pending orders can be edited" });

            if (dto.ReceiverName != null)
                order.ReceiverName = dto.ReceiverName.Trim();

            if (dto.ReceiverPhone != null)
                order.ReceiverPhone = dto.ReceiverPhone.Trim();

            if (dto.ShippingAddress != null)
                order.ShippingAddressFull = dto.ShippingAddress.Trim();

            if (dto.Email != null)
                order.GuestEmail = dto.Email.Trim();

            if (dto.PaymentMethod != null)
                order.PaymentMethod = dto.PaymentMethod.Trim();

            if (dto.Note != null)
                order.Note = dto.Note.Trim();

            if (string.IsNullOrWhiteSpace(order.ReceiverName))
                return BadRequest(new { message = "Receiver name is required" });

            if (string.IsNullOrWhiteSpace(order.ReceiverPhone))
                return BadRequest(new { message = "Receiver phone is required" });

            if (string.IsNullOrWhiteSpace(order.ShippingAddressFull))
                return BadRequest(new { message = "Shipping address is required" });

            order.UpdatedAt = DateTime.Now;
            await _orderRepository.UpdateAsync(order);

            return Ok(order);
        }

        /// <summary>
        /// Update order status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusDto dto)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            order.OrderStatus = NormalizeStatus(dto.Status);
            order.UpdatedAt = DateTime.Now;
            await _orderRepository.UpdateAsync(order);

            return Ok(order);
        }

        /// <summary>
        /// Cancel order
        /// </summary>
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(long id)
        {
            var order = await _orderRepository.GetWithDetailsAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
            if (!CanAccessOrder(order)) return Forbid();

            if (order.OrderStatus == "delivered")
                return BadRequest(new { message = "Cannot cancel completed order" });

            if (order.OrderStatus == "cancelled")
                return Ok(new { message = "Order already cancelled", order });

            await RestoreOrderStock(id);

            order.OrderStatus = "cancelled";
            order.CancelledReason = "Cancelled by customer";
            order.UpdatedAt = DateTime.Now;
            await _orderRepository.UpdateAsync(order);

            return Ok(new { message = "Order cancelled successfully", order });
        }

        /// <summary>
        /// Delete an order owned by the current user
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var order = await _orderRepository.GetWithDetailsAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
            if (!CanAccessOrder(order)) return Forbid();

            if (order.OrderStatus != "pending" && order.OrderStatus != "cancelled")
                return BadRequest(new { message = "Only pending or cancelled orders can be deleted" });

            if (order.OrderStatus != "cancelled")
                await RestoreOrderStock(id);

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            foreach (var detail in details)
                await _orderDetailRepository.DeleteAsync(detail);

            await _orderRepository.DeleteAsync(order);
            return Ok(new { message = "Order deleted successfully" });
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        private bool CanAccessOrder(Order order)
        {
            return IsAdmin() || (TryGetCurrentUserId(out var userId) && order.UserId == userId);
        }

        private async Task RestoreOrderStock(long orderId)
        {
            var details = await _orderDetailRepository.GetByOrderAsync(orderId);
            foreach (var detail in details)
            {
                var productId = detail.ProductVariant?.ProductId ?? 0;
                var product = productId > 0 ? await _productRepository.GetProductWithVariantsAsync(productId) : null;
                var variant = product?.ProductVariants.FirstOrDefault(v => v.Id == detail.ProductVariantId);
                if (product != null && variant != null)
                {
                    variant.StockQuantity += detail.Quantity;
                    product.SoldCount = Math.Max(0, product.SoldCount - detail.Quantity);
                    await _productRepository.UpdateAsync(product);
                }
            }
        }

        private static string NormalizeStatus(string? status)
        {
            return status?.ToLowerInvariant() switch
            {
                "completed" => "delivered",
                "delivered" => "delivered",
                "cancelled" => "cancelled",
                "shipping" => "shipping",
                "confirmed" => "confirmed",
                _ => "pending"
            };
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? Email { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
    }

    public class OrderItemDto
    {
        public long ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateOrderDto
    {
        public string? ShippingAddress { get; set; }
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? Email { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
}
