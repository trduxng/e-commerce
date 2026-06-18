using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using BaseCore.APIService.Controllers;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NUnit.Framework;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class ReturnManagementTests
    {
        private SQLServerDbContext _db = null!;
        private OrdersController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            _db = new SQLServerDbContext(options);
            _controller = new OrdersController(
                new OrderRepositoryEF(_db),
                new OrderDetailRepositoryEF(_db),
                new ProductRepositoryEF(_db),
                _db);

            var admin = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = admin }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _db.Dispose();
        }

        [Test]
        public async Task ApproveReturn_RefundsPaymentAndRestoresStockOnlyOnce()
        {
            await SeedReturnRequest();

            var firstResult = await _controller.ProcessReturn(
                301,
                new ReturnDecisionDto { Decision = "approve" });

            Assert.That(firstResult, Is.TypeOf<OkObjectResult>());

            _db.ChangeTracker.Clear();
            var orderAfterFirstApproval = await _db.Orders.SingleAsync(order => order.Id == 301);
            var productAfterFirstApproval = await _db.Products.SingleAsync(product => product.Id == 101);
            var variantAfterFirstApproval = await _db.ProductVariants.SingleAsync(variant => variant.Id == 201);

            Assert.Multiple(() =>
            {
                Assert.That(orderAfterFirstApproval.OrderStatus, Is.EqualTo("refunded"));
                Assert.That(orderAfterFirstApproval.PaymentStatus, Is.EqualTo("refunded"));
                Assert.That(orderAfterFirstApproval.TotalAmount, Is.EqualTo(230000));
                Assert.That(variantAfterFirstApproval.StockQuantity, Is.EqualTo(7));
                Assert.That(productAfterFirstApproval.SoldCount, Is.EqualTo(0));
            });

            var secondResult = await _controller.ProcessReturn(
                301,
                new ReturnDecisionDto { Decision = "approve" });

            Assert.That(secondResult, Is.TypeOf<OkObjectResult>());

            _db.ChangeTracker.Clear();
            var variantAfterSecondApproval = await _db.ProductVariants.SingleAsync(variant => variant.Id == 201);
            Assert.That(variantAfterSecondApproval.StockQuantity, Is.EqualTo(7));
        }

        [Test]
        public async Task RejectReturn_DoesNotChangeStockOrPayment()
        {
            await SeedReturnRequest();

            var result = await _controller.ProcessReturn(
                301,
                new ReturnDecisionDto { Decision = "reject" });

            Assert.That(result, Is.TypeOf<OkObjectResult>());

            _db.ChangeTracker.Clear();
            var order = await _db.Orders.SingleAsync(item => item.Id == 301);
            var variant = await _db.ProductVariants.SingleAsync(item => item.Id == 201);
            var product = await _db.Products.SingleAsync(item => item.Id == 101);

            Assert.Multiple(() =>
            {
                Assert.That(order.OrderStatus, Is.EqualTo("return_rejected"));
                Assert.That(order.PaymentStatus, Is.EqualTo("paid"));
                Assert.That(variant.StockQuantity, Is.EqualTo(5));
                Assert.That(product.SoldCount, Is.EqualTo(2));
            });
        }

        [Test]
        public async Task RequestReturn_AcceptsLegacyCompletedStatus()
        {
            var order = new Order
            {
                Id = 302,
                UserId = 1,
                OrderCode = "ORD-COMPLETED-001",
                ReceiverName = "Return Customer",
                ReceiverPhone = "0900000000",
                ShippingAddressFull = "Test address",
                PaymentMethod = "cod",
                PaymentStatus = "paid",
                OrderStatus = "completed"
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            var result = await _controller.RequestReturn(order.Id);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            _db.ChangeTracker.Clear();
            var updatedOrder = await _db.Orders.SingleAsync(item => item.Id == order.Id);
            Assert.That(updatedOrder.OrderStatus, Is.EqualTo("return_requested"));
        }

        private async Task SeedReturnRequest()
        {
            var product = new Product
            {
                Id = 101,
                Name = "Return Test Product",
                Slug = "return-test-product",
                CategoryId = 1,
                BasePrice = 100000,
                SoldCount = 2,
                IsActive = true,
                ProductVariants = new List<ProductVariant>
                {
                    new ProductVariant
                    {
                        Id = 201,
                        Sku = "RETURN-001",
                        Price = 100000,
                        StockQuantity = 5,
                        IsActive = true
                    }
                }
            };

            var order = new Order
            {
                Id = 301,
                OrderCode = "ORD-RETURN-001",
                ReceiverName = "Return Customer",
                ReceiverPhone = "0900000000",
                ShippingAddressFull = "Test address",
                Subtotal = 200000,
                ShippingFee = 30000,
                TotalAmount = 230000,
                PaymentMethod = "banktransfer",
                PaymentStatus = "paid",
                OrderStatus = "return_requested",
                OrderDetails = new List<OrderDetail>
                {
                    new OrderDetail
                    {
                        Id = 401,
                        ProductVariantId = 201,
                        ProductNameSnapshot = "Return Test Product",
                        SkuSnapshot = "RETURN-001",
                        Quantity = 2,
                        UnitPrice = 100000,
                        TotalPrice = 200000
                    }
                }
            };

            _db.Products.Add(product);
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
        }
    }
}
