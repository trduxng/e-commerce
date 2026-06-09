using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/cart")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly SQLServerDbContext _db;
        private const decimal DefaultShippingFee = 30000;

        public CartController(SQLServerDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var cart = await GetOrCreateCart(userId);
            return Ok(BuildCartResponse(cart));
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            if (dto.Quantity <= 0)
                return BadRequest(new { message = "Quantity must be greater than zero" });

            var productResult = await GetProductVariant(dto.ProductId, dto.ProductVariantId);
            if (productResult == null)
                return BadRequest(new { message = "Product not found or unavailable" });

            var (_, variant) = productResult.Value;
            var cart = await GetOrCreateCart(userId);
            var existing = cart.Items.FirstOrDefault(item => item.ProductVariantId == variant.Id);
            var nextQuantity = (existing?.Quantity ?? 0) + dto.Quantity;

            if (variant.StockQuantity <= 0)
                return BadRequest(new { message = "This product is out of stock." });

            if (nextQuantity > variant.StockQuantity)
                return BadRequest(new { message = $"Cannot add more than {variant.StockQuantity} item{(variant.StockQuantity == 1 ? "" : "s")} in stock." });

            if (existing == null)
            {
                var unitPrice = variant.SalePrice ?? variant.Price;
                _db.CartItems.Add(new CartItem
                {
                    CartId = cart.Id,
                    ProductVariantId = variant.Id,
                    Quantity = dto.Quantity,
                    PriceSnapshot = unitPrice,
                    ProductNameSnapshot = productResult.Value.Product.Name,
                    ImageUrlSnapshot = variant.ImageUrl ?? productResult.Value.Product.ImageUrl,
                    SkuSnapshot = variant.Sku,
                    SizeSnapshot = variant.Size,
                    ColorSnapshot = variant.Color,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
            }
            else
            {
                existing.Quantity = nextQuantity;
                existing.UpdatedAt = DateTime.Now;
            }

            cart.UpdatedAt = DateTime.Now;
            await _db.SaveChangesAsync();

            cart = await GetOrCreateCart(userId);
            return Ok(BuildCartResponse(cart, "Product added to cart."));
        }

        [HttpPut("items/{itemKey:long}")]
        public async Task<IActionResult> UpdateItem(long itemKey, [FromBody] UpdateCartItemDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            if (dto.Quantity <= 0)
                return BadRequest(new { message = "Quantity must be at least 1." });

            var cart = await GetOrCreateCart(userId);
            var existing = FindCartItem(cart, itemKey);
            if (existing == null)
                return NotFound(new { message = "Cart item not found" });

            var variant = existing.ProductVariant;
            if (variant?.Product == null || !variant.IsActive || !variant.Product.IsActive || variant.Product.DeletedAt != null)
                return BadRequest(new { message = "Product not found or unavailable" });

            if (dto.Quantity > variant.StockQuantity)
                return BadRequest(new { message = $"Cannot add more than {variant.StockQuantity} item{(variant.StockQuantity == 1 ? "" : "s")} in stock." });

            existing.Quantity = dto.Quantity;
            existing.UpdatedAt = DateTime.Now;
            cart.UpdatedAt = DateTime.Now;
            await _db.SaveChangesAsync();

            cart = await GetOrCreateCart(userId);
            return Ok(BuildCartResponse(cart));
        }

        [HttpDelete("items/{itemKey:long}")]
        public async Task<IActionResult> RemoveItem(long itemKey)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var cart = await GetOrCreateCart(userId);
            var existing = FindCartItem(cart, itemKey);
            if (existing != null)
            {
                _db.CartItems.Remove(existing);
                cart.UpdatedAt = DateTime.Now;
                await _db.SaveChangesAsync();
            }

            cart = await GetOrCreateCart(userId);
            return Ok(BuildCartResponse(cart));
        }

        [HttpDelete]
        public async Task<IActionResult> Clear()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var cart = await GetOrCreateCart(userId);
            if (cart.Items.Count > 0)
            {
                _db.CartItems.RemoveRange(cart.Items);
                cart.UpdatedAt = DateTime.Now;
                await _db.SaveChangesAsync();
            }

            return Ok(BuildCartResponse(await GetOrCreateCart(userId)));
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CartCheckoutDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var cart = await GetOrCreateCart(userId);
            if (cart.Items.Count == 0)
                return BadRequest(new { message = "Your cart is empty." });

            await using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                decimal subtotal = 0;
                var orderDetails = new List<OrderDetail>();

                foreach (var item in cart.Items)
                {
                    var variant = await _db.ProductVariants
                        .Include(v => v.Product)
                        .FirstOrDefaultAsync(v => v.Id == item.ProductVariantId);

                    if (variant?.Product == null || !variant.IsActive || !variant.Product.IsActive || variant.Product.DeletedAt != null)
                        return BadRequest(new { message = "One or more cart products are no longer available." });

                    if (variant.StockQuantity < item.Quantity)
                        return BadRequest(new { message = $"Insufficient stock for {variant.Product.Name}" });

                    var unitPrice = variant.SalePrice ?? variant.Price;
                    subtotal += unitPrice * item.Quantity;
                    orderDetails.Add(new OrderDetail
                    {
                        ProductVariantId = variant.Id,
                        ProductNameSnapshot = variant.Product.Name,
                        SizeSnapshot = variant.Size,
                        ColorSnapshot = variant.Color,
                        SkuSnapshot = variant.Sku,
                        Quantity = item.Quantity,
                        UnitPrice = unitPrice,
                        TotalPrice = unitPrice * item.Quantity
                    });

                    variant.StockQuantity -= item.Quantity;
                    variant.Product.SoldCount += item.Quantity;
                }

                var validationMessage = ValidateCheckout(dto);
                if (validationMessage != null)
                    return BadRequest(new { message = validationMessage });

                var shippingFee = GetShippingFee(dto.ShippingMethod);
                const decimal discountAmount = 0;
                const decimal taxAmount = 0;
                var order = new Order
                {
                    OrderCode = $"ORD-{DateTime.Now:yyyy}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    UserId = userId,
                    GuestEmail = dto.Email,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    ReceiverName = string.IsNullOrWhiteSpace(dto.ReceiverName) ? "Customer" : dto.ReceiverName.Trim(),
                    ReceiverPhone = string.IsNullOrWhiteSpace(dto.ReceiverPhone) ? "0000000000" : dto.ReceiverPhone.Trim(),
                    ShippingAddressFull = dto.ShippingAddress ?? "",
                    Subtotal = subtotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discountAmount,
                    TaxAmount = taxAmount,
                    TotalAmount = subtotal + shippingFee,
                    PaymentMethod = dto.PaymentMethod!.Trim().ToLowerInvariant(),
                    PaymentStatus = "pending",
                    OrderStatus = "pending",
                    CouponCode = null,
                    Note = dto.Note,
                    OrderDetails = orderDetails
                };

                _db.Orders.Add(order);
                _db.CartItems.RemoveRange(cart.Items);
                cart.UpdatedAt = DateTime.Now;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Created($"/api/orders/{order.Id}", new { order, details = orderDetails, cart = BuildCartResponse(await GetOrCreateCart(userId)) });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<Cart> GetOrCreateCart(long userId)
        {
            var cart = await LoadCart(userId);
            if (cart != null)
                return cart;

            cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();

            return await LoadCart(userId) ?? cart;
        }

        private Task<Cart?> LoadCart(long userId)
        {
            return _db.Carts
                .Include(cart => cart.Items)
                .ThenInclude(item => item.ProductVariant)
                .ThenInclude(variant => variant!.Product)
                .FirstOrDefaultAsync(cart => cart.UserId == userId);
        }

        private async Task<(Product Product, ProductVariant Variant)?> GetProductVariant(long productId, long? productVariantId = null)
        {
            if (productVariantId.HasValue)
            {
                var selectedVariant = await _db.ProductVariants
                    .Include(variant => variant.Product)
                    .FirstOrDefaultAsync(variant =>
                        variant.Id == productVariantId.Value &&
                        variant.ProductId == productId &&
                        variant.IsActive &&
                        variant.Product != null &&
                        variant.Product.IsActive &&
                        variant.Product.DeletedAt == null);

                return selectedVariant?.Product != null ? (selectedVariant.Product, selectedVariant) : null;
            }

            var product = await _db.Products
                .Include(product => product.ProductVariants)
                .FirstOrDefaultAsync(product => product.Id == productId && product.DeletedAt == null && product.IsActive);

            var variant = product?.ProductVariants
                .Where(item => item.IsActive)
                .OrderBy(item => item.Id)
                .FirstOrDefault();

            return product != null && variant != null ? (product, variant) : null;
        }

        private static CartItem? FindCartItem(Cart cart, long itemKey)
        {
            return cart.Items.FirstOrDefault(item => item.ProductVariantId == itemKey)
                ?? cart.Items.FirstOrDefault(item => item.Id == itemKey)
                ?? cart.Items.FirstOrDefault(item => item.ProductVariant?.ProductId == itemKey);
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }

        private static decimal GetShippingFee(string? shippingMethod)
        {
            return shippingMethod?.Trim().ToLowerInvariant() switch
            {
                "express" => 55000,
                "pickup" => 0,
                _ => DefaultShippingFee
            };
        }

        private static string? ValidateCheckout(CartCheckoutDto dto)
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

            if (!string.IsNullOrWhiteSpace(dto.CouponCode))
                return "Voucher code is not valid.";

            return null;
        }

        private static object BuildCartResponse(Cart cart, string? message = null)
        {
            var items = cart.Items
                .Where(item => item.ProductVariant?.Product != null)
                .Select(item =>
                {
                    var variant = item.ProductVariant!;
                    var product = variant.Product!;
                    var price = item.PriceSnapshot > 0 ? item.PriceSnapshot : variant.SalePrice ?? variant.Price;
                    return new
                    {
                        cartItemId = item.Id,
                        id = product.Id,
                        productId = product.Id,
                        productVariantId = variant.Id,
                        name = item.ProductNameSnapshot ?? product.Name,
                        price,
                        imageUrl = item.ImageUrlSnapshot ?? variant.ImageUrl ?? product.ImageUrl ?? "/img/product-1.jpg",
                        sku = item.SkuSnapshot ?? variant.Sku,
                        size = item.SizeSnapshot ?? variant.Size,
                        color = item.ColorSnapshot ?? variant.Color,
                        stock = Math.Max(0, variant.StockQuantity),
                        quantity = item.Quantity,
                        lineTotal = price * item.Quantity
                    };
                })
                .ToList();

            var subtotal = items.Sum(item => item.lineTotal);
            var shipping = subtotal > 0 ? DefaultShippingFee : 0;

            return new
            {
                items,
                count = items.Sum(item => item.quantity),
                subtotal,
                shipping,
                total = subtotal + shipping,
                message
            };
        }
    }

    public class AddCartItemDto
    {
        public long ProductId { get; set; }
        public long? ProductVariantId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemDto
    {
        public int Quantity { get; set; }
    }

    public class CartCheckoutDto
    {
        public string? ShippingAddress { get; set; }
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? Email { get; set; }
        public string? PaymentMethod { get; set; }
        public string? ShippingMethod { get; set; }
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
    }
}
