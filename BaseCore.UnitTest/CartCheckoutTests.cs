using NUnit.Framework;
using BaseCore.APIService.Controllers;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class CartCheckoutTests
    {
        private SQLServerDbContext _db;
        private CartController _controller;
        private const long TestUserId = 1;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            _db = new SQLServerDbContext(options);
            _controller = new CartController(_db);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
                new Claim(ClaimTypes.Role, "Customer")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            SeedDatabase();
        }

        [TearDown]
        public void TearDown()
        {
            _db.Dispose();
        }

        private void SeedDatabase()
        {
            var product = new Product
            {
                Id = 101,
                Name = "Test Headphones",
                Slug = "test-headphones",
                CategoryId = 1,
                BasePrice = 100000,
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                ProductVariants = new List<ProductVariant>
                {
                    new ProductVariant
                    {
                        Id = 201,
                        Sku = "HP-001",
                        Price = 100000,
                        StockQuantity = 10,
                        IsActive = true
                    }
                }
            };
            _db.Products.Add(product);

            var couponPercent = new Coupon
            {
                Id = 1,
                Code = "PERCENT20",
                Type = "percent",
                Value = 20,
                MinOrderValue = 0,
                MaxDiscountAmount = 50000,
                UsageLimit = 5,
                UsedCount = 0,
                IsActive = true,
                StartDate = DateTime.Now.AddDays(-1),
                EndDate = DateTime.Now.AddDays(1)
            };

            var couponFixed = new Coupon
            {
                Id = 2,
                Code = "FIXED50",
                Type = "fixed",
                Value = 50000,
                MinOrderValue = 0,
                UsageLimit = 5,
                UsedCount = 0,
                IsActive = true,
                StartDate = DateTime.Now.AddDays(-1),
                EndDate = DateTime.Now.AddDays(1)
            };

            var couponExpired = new Coupon
            {
                Id = 3,
                Code = "EXPIRED",
                Type = "fixed",
                Value = 10000,
                MinOrderValue = 0,
                UsageLimit = 5,
                UsedCount = 0,
                IsActive = true,
                StartDate = DateTime.Now.AddDays(-5),
                EndDate = DateTime.Now.AddDays(-1)
            };

            var couponLimit = new Coupon
            {
                Id = 4,
                Code = "LIMIT",
                Type = "fixed",
                Value = 10000,
                MinOrderValue = 0,
                UsageLimit = 2,
                UsedCount = 2,
                IsActive = true,
                StartDate = DateTime.Now.AddDays(-1),
                EndDate = DateTime.Now.AddDays(1)
            };

            _db.Coupons.AddRange(couponPercent, couponFixed, couponExpired, couponLimit);
            _db.SaveChanges();
        }

        private async Task CreateCartWithItem(long variantId, int quantity)
        {
            var cart = new Cart
            {
                UserId = TestUserId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Items = new List<CartItem>
                {
                    new CartItem
                    {
                        ProductVariantId = variantId,
                        Quantity = quantity,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    }
                }
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        [Test]
        public async Task Checkout_WithValidPercentCoupon_AppliesDiscountAndIncrementsUsedCount()
        {
            // Arrange
            await CreateCartWithItem(201, 2); // Subtotal = 200,000
            var dto = new CartCheckoutDto
            {
                ReceiverName = "John Doe",
                ReceiverPhone = "0987654321",
                ShippingAddress = "123 Main St",
                PaymentMethod = "cod",
                ShippingMethod = "standard",
                CouponCode = "PERCENT20"
            };

            // Act
            var result = await _controller.Checkout(dto);

            // Assert
            Assert.IsInstanceOf<CreatedResult>(result);
            var createdResult = (CreatedResult)result;
            
            // Extract the anonymous object properties via reflection or dynamic
            dynamic response = createdResult.Value;
            var order = (Order)response.GetType().GetProperty("order").GetValue(response);

            // Subtotal = 200,000. 20% discount = 40,000. Shipping = 30,000. Total = 200,000 + 30,000 - 40,000 = 190,000
            Assert.AreEqual(200000, order.Subtotal);
            Assert.AreEqual(40000, order.DiscountAmount);
            Assert.AreEqual(190000, order.TotalAmount);
            Assert.AreEqual("PERCENT20", order.CouponCode);

            // Verify Coupon UsedCount in DB
            var coupon = await _db.Coupons.FirstAsync(c => c.Code == "PERCENT20");
            Assert.AreEqual(1, coupon.UsedCount);
        }

        [Test]
        public async Task Checkout_WithValidFixedCoupon_AppliesFixedDiscount()
        {
            // Arrange
            await CreateCartWithItem(201, 2); // Subtotal = 200,000
            var dto = new CartCheckoutDto
            {
                ReceiverName = "John Doe",
                ReceiverPhone = "0987654321",
                ShippingAddress = "123 Main St",
                PaymentMethod = "cod",
                ShippingMethod = "standard",
                CouponCode = "FIXED50"
            };

            // Act
            var result = await _controller.Checkout(dto);

            // Assert
            Assert.IsInstanceOf<CreatedResult>(result);
            var createdResult = (CreatedResult)result;
            dynamic response = createdResult.Value;
            var order = (Order)response.GetType().GetProperty("order").GetValue(response);

            // Subtotal = 200,000. Fixed discount = 50,000. Shipping = 30,000. Total = 200,000 + 30,000 - 50,000 = 180,000
            Assert.AreEqual(200000, order.Subtotal);
            Assert.AreEqual(50000, order.DiscountAmount);
            Assert.AreEqual(180000, order.TotalAmount);
            Assert.AreEqual("FIXED50", order.CouponCode);
        }

        [Test]
        public async Task Checkout_WithExpiredCoupon_ReturnsBadRequest()
        {
            // Arrange
            await CreateCartWithItem(201, 1);
            var dto = new CartCheckoutDto
            {
                ReceiverName = "John Doe",
                ReceiverPhone = "0987654321",
                ShippingAddress = "123 Main St",
                PaymentMethod = "cod",
                ShippingMethod = "standard",
                CouponCode = "EXPIRED"
            };

            // Act
            var result = await _controller.Checkout(dto);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
            var badRequest = (BadRequestObjectResult)result;
            dynamic responseObj = badRequest.Value;
            var message = (string)responseObj.GetType().GetProperty("message").GetValue(responseObj);
            Assert.AreEqual("Invalid or expired coupon code", message);
        }

        [Test]
        public async Task Checkout_WithLimitReachedCoupon_ReturnsBadRequest()
        {
            // Arrange
            await CreateCartWithItem(201, 1);
            var dto = new CartCheckoutDto
            {
                ReceiverName = "John Doe",
                ReceiverPhone = "0987654321",
                ShippingAddress = "123 Main St",
                PaymentMethod = "cod",
                ShippingMethod = "standard",
                CouponCode = "LIMIT"
            };

            // Act
            var result = await _controller.Checkout(dto);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
            var badRequest = (BadRequestObjectResult)result;
            dynamic responseObj = badRequest.Value;
            var message = (string)responseObj.GetType().GetProperty("message").GetValue(responseObj);
            Assert.AreEqual("Coupon usage limit reached", message);
        }
    }
}
