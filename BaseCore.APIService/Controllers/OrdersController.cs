using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Repository;
using BaseCore.APIService.Services;
using System.Security.Claims;
using System.Data;

using Microsoft.EntityFrameworkCore;


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
        private readonly SQLServerDbContext _db;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,

            IProductRepositoryEF productRepository,
            SQLServerDbContext db)

        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _db = db;
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
            if (orders == null || !orders.Any())
            {
                await SeedOrdersForUserAsync(userLongId);
                orders = await _orderRepository.GetByUserAsync(userLongId);
            }
            await PopulateReviewStatus(orders);
            return Ok(orders);
        }

        /// <summary>
        /// Seed specific return orders for testing
        /// </summary>
        [HttpPost("seed-returns")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedReturns()
        {
            var variants = await _db.ProductVariants
                .Include(pv => pv.Product)
                .Where(pv => pv.IsActive)
                .Take(10)
                .ToListAsync();

            if (!variants.Any()) return BadRequest("No active products found.");

            var user = await _db.Set<User>().FirstOrDefaultAsync(u => u.Email == "customer@basecore.local");
            long userId = user?.Id ?? 1;

            var random = new Random();
            for (int i = 0; i < 5; i++)
            {
                var order = new Order
                {
                    OrderCode = $"RET-{DateTime.Now:yyyy}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{random.Next(100, 999)}",
                    UserId = userId,
                    GuestEmail = "return_test@basecore.local",
                    CreatedAt = DateTime.Now.AddDays(-random.Next(1, 10)),
                    UpdatedAt = DateTime.Now,
                    ReceiverName = "Khách hàng trả lại " + i,
                    ReceiverPhone = "090000000" + i,
                    ShippingAddressFull = "Địa chỉ trả hàng " + i,
                    Subtotal = 0,
                    ShippingFee = 30000,
                    DiscountAmount = 0,
                    TaxAmount = 0,
                    TotalAmount = 30000,
                    PaymentMethod = "cod",
                    PaymentStatus = "paid",
                    OrderStatus = "return_requested",
                };

                await _orderRepository.AddAsync(order);

                decimal subtotal = 0;
                int itemCount = random.Next(1, 3);
                for (int j = 0; j < itemCount; j++)
                {
                    var variant = variants[random.Next(variants.Count)];
                    var qty = random.Next(1, 3);
                    var price = variant.SalePrice ?? variant.Price;
                    var detail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductVariantId = variant.Id,
                        ProductNameSnapshot = variant.Product?.Name ?? "Sản phẩm",
                        SizeSnapshot = variant.Size,
                        ColorSnapshot = variant.Color,
                        SkuSnapshot = variant.Sku ?? "SKU-TEMP",
                        Quantity = qty,
                        UnitPrice = price,
                        TotalPrice = price * qty
                    };
                    subtotal += detail.TotalPrice;
                    await _orderDetailRepository.AddAsync(detail);
                }

                order.Subtotal = subtotal;
                order.TotalAmount = subtotal + order.ShippingFee;
                await _orderRepository.UpdateAsync(order);
            }

            return Ok(new { message = "Seeded return orders successfully." });
        }

        /// <summary>
        /// Get all orders (Admin only)
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Admin,Manager,manager")]
        public async Task<IActionResult> GetAllOrders(
            [FromQuery] string? keyword,
            [FromQuery] string? status,
            [FromQuery] string? paymentStatus,
            [FromQuery] string? shippingStatus,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? billingEmail,
            [FromQuery] string? billingLastName,
            [FromQuery] string? billingPhone,
            [FromQuery] string? orderCode,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] string? sortField,
            [FromQuery] string? sortDir)
        {
            if (page.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(keyword) || !string.IsNullOrWhiteSpace(status) || !string.IsNullOrWhiteSpace(paymentStatus) || !string.IsNullOrWhiteSpace(shippingStatus) || startDate.HasValue || endDate.HasValue || !string.IsNullOrWhiteSpace(billingEmail) || !string.IsNullOrWhiteSpace(billingLastName) || !string.IsNullOrWhiteSpace(billingPhone) || !string.IsNullOrWhiteSpace(orderCode) || !string.IsNullOrWhiteSpace(sortField) || !string.IsNullOrWhiteSpace(sortDir))
            {
                var safePage = Math.Max(1, page ?? 1);
                var safePageSize = Math.Clamp(pageSize ?? 10, 1, 100);
                var (items, totalCount, summary) = await _orderRepository.SearchAllWithDetailsAsync(
                    keyword, status, paymentStatus, shippingStatus, startDate, endDate, billingEmail, billingLastName, billingPhone, orderCode, safePage, safePageSize, sortField, sortDir);

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

            await PopulateReviewStatus(new[] { order });
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

            var validationMessage = ValidateCheckout(dto);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            // Luồng Mua ngay tạo đơn trực tiếp, nhưng vẫn phải bảo vệ trừ kho và tạo chi tiết bằng transaction.
            await using var transaction = await _db.Database.BeginTransactionAsync();

            // Validate products and calculate total
            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest(new { message = "Quantity must be greater than zero" });

                // Lấy dữ liệu catalog hiện tại thay vì tin giá/tồn kho từ payload frontend.
                var product = await _productRepository.GetProductWithVariantsAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });

                var variant = item.ProductVariantId.HasValue
                    ? product.ProductVariants.FirstOrDefault(v => v.Id == item.ProductVariantId.Value && v.IsActive)
                    : product.ProductVariants
                        .Where(v => v.IsActive)
                        .OrderBy(v => v.Id)
                        .FirstOrDefault();

                if (variant == null)
                    return BadRequest(new { message = $"Product {product.Name} has no active variant for the selected option" });

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

                // Giữ tồn kho và SoldCount đồng bộ với từng dòng đơn.
                variant.StockQuantity -= item.Quantity;
                product.SoldCount += item.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            var shippingFee = GetShippingFee(dto.ShippingMethod);
            // Coupon được tính lại trên tổng tiền thật của các variant đã xác thực.
            var couponApplication = await CouponDiscountCalculator.ApplyAsync(_db, dto.CouponCode, totalAmount);
            if (couponApplication.ErrorMessage != null)
                return BadRequest(new { message = couponApplication.ErrorMessage });

            var discountAmount = couponApplication.DiscountAmount;
            const decimal taxAmount = 0;
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
                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                TaxAmount = taxAmount,
                TotalAmount = Math.Max(0, totalAmount - discountAmount) + shippingFee + taxAmount,
                PaymentMethod = dto.PaymentMethod!.Trim().ToLowerInvariant(),
                PaymentStatus = "pending",
                OrderStatus = "pending",
                CouponCode = couponApplication.Code,
                Note = dto.Note
            };

            if (couponApplication.Coupon != null)
                couponApplication.Coupon.UsedCount += 1;

            await _orderRepository.AddAsync(order);

            // Add order details
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            await transaction.CommitAsync();
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
            {
                order,
                details = orderDetails,
                coupon = couponApplication.Code == null
                    ? null
                    : new { code = couponApplication.Code, discountAmount }
            });

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
        [Authorize(Roles = "Admin,Manager,manager")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusDto dto)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            var currentStatus = NormalizeStatus(order.OrderStatus);
            var nextStatus = NormalizeStatus(dto.Status);
            var returnStatuses = new HashSet<string>
            {
                "return_requested",
                "returned",
                "refunded",
                "return_rejected"
            };

            // Trạng thái trả hàng phải đi qua endpoint chuyên biệt để hoàn kho và hoàn tiền cùng lúc.
            if (returnStatuses.Contains(currentStatus) || returnStatuses.Contains(nextStatus))
            {
                return BadRequest(new { message = "Use return management to process return statuses." });
            }

            order.OrderStatus = nextStatus;
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

            var currentStatus = NormalizeStatus(order.OrderStatus);

            if (currentStatus == "delivered")
                return BadRequest(new { message = "Cannot cancel completed order" });

            if (currentStatus == "cancelled")
                return Ok(new { message = "Order already cancelled", order });

            // Hủy đơn hoàn lại tồn kho và giảm SoldCount theo các OrderDetail đã lưu.
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

            var currentStatus = NormalizeStatus(order.OrderStatus);

            if (currentStatus != "pending" && currentStatus != "cancelled")
                return BadRequest(new { message = "Only pending or cancelled orders can be deleted" });

            if (currentStatus != "cancelled")
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

        private async Task PopulateReviewStatus(IEnumerable<Order> orders)
        {
            // Ghép review theo OrderDetail để frontend biết dòng nào đã được đánh giá.
            var details = orders
                .SelectMany(order => order.OrderDetails)
                .ToList();
            var detailIds = details.Select(detail => detail.Id).ToList();
            if (detailIds.Count == 0)
                return;

            var reviews = await _db.Reviews
                .Where(review => review.BillDetailId.HasValue && detailIds.Contains(review.BillDetailId.Value))
                .Select(review => new { BillDetailId = review.BillDetailId!.Value, review.Id })
                .ToListAsync();
            var reviewsByDetailId = reviews
                .GroupBy(review => review.BillDetailId)
                .ToDictionary(group => group.Key, group => group.First().Id);

            foreach (var detail in details)
            {
                if (reviewsByDetailId.TryGetValue(detail.Id, out var reviewId))
                {
                    detail.IsReviewed = true;
                    detail.ReviewId = reviewId;
                }
            }
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin") || User.IsInRole("Manager") || User.IsInRole("manager");
        }

        private async Task SeedOrdersForUserAsync(long userId)
        {
            var variants = await _db.ProductVariants
                .Include(pv => pv.Product)
                .Where(pv => pv.IsActive)
                .Take(10)
                .ToListAsync();

            if (!variants.Any()) return;

            var random = new Random();
            var statuses = new[] { "pending", "confirmed", "shipping", "delivered", "return_requested" };
            var paymentStatuses = new[] { "pending", "paid" };
            var paymentMethods = new[] { "cod", "banktransfer", "paypal" };

            for (int i = 0; i < 5; i++)
            {
                var orderStatus = statuses[random.Next(statuses.Length)];
                var paymentStatus = orderStatus == "delivered" ? "paid" : paymentStatuses[random.Next(paymentStatuses.Length)];
                var paymentMethod = paymentMethods[random.Next(paymentMethods.Length)];
                
                var order = new Order
                {
                    OrderCode = $"ORD-{DateTime.Now:yyyy}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{random.Next(100, 999)}",
                    UserId = userId,
                    GuestEmail = "customer@basecore.local",
                    CreatedAt = DateTime.Now.AddDays(-random.Next(1, 30)),
                    UpdatedAt = DateTime.Now,
                    ReceiverName = "Khách hàng thử nghiệm",
                    ReceiverPhone = "0987654321",
                    ShippingAddressFull = "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                    Subtotal = 0,
                    ShippingFee = 30000,
                    DiscountAmount = 0,
                    TaxAmount = 0,
                    TotalAmount = 30000,
                    PaymentMethod = paymentMethod,
                    PaymentStatus = paymentStatus,
                    OrderStatus = orderStatus,
                };

                await _orderRepository.AddAsync(order);

                decimal subtotal = 0;
                int itemCount = random.Next(1, 3);
                for (int j = 0; j < itemCount; j++)
                {
                    var variant = variants[random.Next(variants.Count)];
                    var qty = random.Next(1, 3);
                    var price = variant.SalePrice ?? variant.Price;
                    var detail = new OrderDetail
                    {
                        OrderId = order.Id,
                        ProductVariantId = variant.Id,
                        ProductNameSnapshot = variant.Product?.Name ?? "Sản phẩm",
                        SizeSnapshot = variant.Size,
                        ColorSnapshot = variant.Color,
                        SkuSnapshot = variant.Sku ?? "SKU-TEMP",
                        Quantity = qty,
                        UnitPrice = price,
                        TotalPrice = price * qty
                    };
                    subtotal += detail.TotalPrice;
                    await _orderDetailRepository.AddAsync(detail);
                }

                order.Subtotal = subtotal;
                order.TotalAmount = subtotal + order.ShippingFee;
                await _orderRepository.UpdateAsync(order);
            }
        }

        private bool CanAccessOrder(Order order)
        {
            // Admin xem được mọi đơn; customer chỉ được thao tác trên đơn của chính mình.
            return IsAdmin() || (TryGetCurrentUserId(out var userId) && order.UserId == userId);
        }

        private async Task RestoreOrderStock(long orderId)
        {
            // Dùng snapshot số lượng trong OrderDetail để hoàn kho chính xác.
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

        /// <summary>
        /// Request a return for an order
        /// </summary>
        [HttpPut("{id}/request-return")]
        [Authorize]
        public async Task<IActionResult> RequestReturn(long id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
            if (!CanAccessOrder(order)) return Forbid();

            if (NormalizeStatus(order.OrderStatus) != "delivered")
            {
                return BadRequest(new { message = "Only delivered orders can be returned" });
            }

            order.OrderStatus = "return_requested";
            order.UpdatedAt = DateTime.Now;
            await _orderRepository.UpdateAsync(order);

            return Ok(order);
        }

        /// <summary>
        /// Approve or reject a customer return request.
        /// Approval restores stock, decreases sold count and records the payment as refunded atomically.
        /// </summary>
        [HttpPut("{id}/return-decision")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessReturn(long id, [FromBody] ReturnDecisionDto dto)
        {
            var decision = dto.Decision?.Trim().ToLowerInvariant();
            if (decision is not ("approve" or "reject"))
                return BadRequest(new { message = "Return decision must be approve or reject." });

            await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                var order = await _db.Orders
                    .Include(item => item.OrderDetails)
                    .ThenInclude(detail => detail.ProductVariant)
                    .ThenInclude(variant => variant!.Product)
                    .FirstOrDefaultAsync(item => item.Id == id);

                if (order == null)
                    return NotFound(new { message = "Order not found" });

                var currentStatus = NormalizeStatus(order.OrderStatus);

                // Lặp lại thao tác duyệt không được cộng kho lần thứ hai.
                if (decision == "approve" && currentStatus == "refunded")
                {
                    return Ok(BuildReturnDecisionResponse(
                        order,
                        "Return was already approved.",
                        0));
                }

                if (currentStatus != "return_requested")
                {
                    return BadRequest(new { message = "This order does not have a pending return request." });
                }

                if (decision == "reject")
                {
                    order.OrderStatus = "return_rejected";
                    order.UpdatedAt = DateTime.Now;
                    await _db.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(BuildReturnDecisionResponse(order, "Return request rejected.", 0));
                }

                var restoredItemCount = 0;
                foreach (var detail in order.OrderDetails)
                {
                    var variant = detail.ProductVariant;
                    if (variant == null)
                    {
                        await transaction.RollbackAsync();
                        return Conflict(new
                        {
                            message = $"Cannot restore stock for order item {detail.ProductNameSnapshot}."
                        });
                    }

                    variant.StockQuantity += detail.Quantity;
                    restoredItemCount += detail.Quantity;

                    if (variant.Product != null)
                    {
                        variant.Product.SoldCount = Math.Max(
                            0,
                            variant.Product.SoldCount - detail.Quantity);
                    }
                }

                // Giữ nguyên TotalAmount làm lịch sử; PaymentStatus=refunded khiến báo cáo trừ khoản này khỏi doanh thu.
                order.OrderStatus = "refunded";
                order.PaymentStatus = "refunded";
                order.UpdatedAt = DateTime.Now;

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(BuildReturnDecisionResponse(
                    order,
                    "Return approved, payment refunded and stock restored.",
                    restoredItemCount));
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static object BuildReturnDecisionResponse(Order order, string message, int restoredItemCount)
        {
            return new
            {
                message,
                order,
                refundedAmount = order.PaymentStatus == "refunded" ? order.TotalAmount : 0,
                restoredItemCount
            };
        }

        private static string NormalizeStatus(string? status)
        {
            return status?.ToLowerInvariant() switch
            {
                "completed" or "delivered" => "delivered",
                "cancel" or "canceled" or "cancelled" => "cancelled",
                "shipping" => "shipping",
                "confirmed" => "confirmed",
                "return_requested" => "return_requested",
                "returned" => "returned",
                "refunded" => "refunded",
                "return_rejected" => "return_rejected",
                _ => "pending"
            };
        }

        private static decimal GetShippingFee(string? shippingMethod)
        {
            return shippingMethod?.Trim().ToLowerInvariant() switch
            {
                "express" => 55000,
                "pickup" => 0,
                _ => 30000
            };
        }

        private static string? ValidateCheckout(CreateOrderDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ReceiverName))
                return "Receiver name is required.";

            if (string.IsNullOrWhiteSpace(dto.ReceiverPhone))
                return "Receiver phone is required.";

            if (string.IsNullOrWhiteSpace(dto.ShippingAddress))
                return "Shipping address is required.";

            var paymentMethod = dto.PaymentMethod?.Trim().ToLowerInvariant();
            if (paymentMethod is not ("cod" or "banktransfer" or "paypal"))
                return "Payment method is not supported.";

            return null;
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
        public string? ShippingMethod { get; set; }
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
    }

    public class OrderItemDto
    {
        public long ProductId { get; set; }
        public long? ProductVariantId { get; set; }
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

    public class ReturnDecisionDto
    {
        public string Decision { get; set; } = "";
    }
}
