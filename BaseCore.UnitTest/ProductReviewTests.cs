using System.Security.Claims;
using BaseCore.APIService.Controllers;
using BaseCore.Entities;
using BaseCore.Repository;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class ProductReviewTests
    {
        private const long UserId = 7;
        private const long ProductId = 101;
        private const long BillDetailId = 301;
        private SQLServerDbContext _db = null!;
        private ProductReviewsController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new SQLServerDbContext(options);
            _controller = new ProductReviewsController(_db)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, UserId.ToString())
                        }, "test"))
                    }
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _db.Dispose();
        }

        [Test]
        public async Task Create_WhenOrderDetailWasAlreadyReviewed_ReturnsConflict()
        {
            SeedOrder("delivered");
            var dto = new SaveProductReviewDto
            {
                BillDetailId = BillDetailId,
                Rating = 5,
                Content = "Sản phẩm tốt."
            };

            var firstResult = await _controller.Create(ProductId, dto);
            var secondResult = await _controller.Create(ProductId, dto);

            Assert.That(firstResult, Is.TypeOf<OkObjectResult>());
            Assert.That(secondResult, Is.TypeOf<ConflictObjectResult>());
            Assert.That(await _db.Reviews.CountAsync(), Is.EqualTo(1));
        }

        [Test]
        public async Task Create_WhenOrderIsNotDelivered_ReturnsForbidden()
        {
            SeedOrder("shipping");

            var result = await _controller.Create(ProductId, new SaveProductReviewDto
            {
                BillDetailId = BillDetailId,
                Rating = 4,
                Content = "Chưa thể đánh giá."
            });

            Assert.That(result, Is.TypeOf<ObjectResult>());
            Assert.That(((ObjectResult)result).StatusCode, Is.EqualTo(StatusCodes.Status403Forbidden));
            Assert.That(await _db.Reviews.CountAsync(), Is.Zero);
        }

        private void SeedOrder(string status)
        {
            var product = new Product
            {
                Id = ProductId,
                Name = "Test Product",
                Slug = "test-product",
                CategoryId = 1,
                BasePrice = 100000,
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            var variant = new ProductVariant
            {
                Id = 201,
                ProductId = ProductId,
                Product = product,
                Sku = "TEST-001",
                Price = 100000,
                StockQuantity = 5,
                IsActive = true
            };
            var order = new Order
            {
                Id = 401,
                UserId = UserId,
                OrderCode = "ORD-TEST",
                ReceiverName = "Customer",
                ReceiverPhone = "0900000000",
                ShippingAddressFull = "Test address",
                OrderStatus = status
            };
            var detail = new OrderDetail
            {
                Id = BillDetailId,
                OrderId = order.Id,
                Order = order,
                ProductVariantId = variant.Id,
                ProductVariant = variant,
                ProductNameSnapshot = product.Name,
                SkuSnapshot = variant.Sku,
                Quantity = 1,
                UnitPrice = variant.Price,
                TotalPrice = variant.Price
            };

            order.OrderDetails.Add(detail);
            product.ProductVariants.Add(variant);
            _db.Orders.Add(order);
            _db.SaveChanges();
        }
    }
}
