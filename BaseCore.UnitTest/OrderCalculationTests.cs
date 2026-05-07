using NUnit.Framework;
using Moq;
using BaseCore.APIService.Controllers;
using BaseCore.Repository.EFCore;
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

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class OrderCalculationTests
    {
        private Mock<IOrderRepositoryEF> _mockOrderRepo;
        private Mock<IOrderDetailRepositoryEF> _mockOrderDetailRepo;
        private Mock<IProductRepositoryEF> _mockProductRepo;
        private OrdersController _controller;

        [SetUp]
        public void Setup()
        {
            _mockOrderRepo = new Mock<IOrderRepositoryEF>();
            _mockOrderDetailRepo = new Mock<IOrderDetailRepositoryEF>();
            _mockProductRepo = new Mock<IProductRepositoryEF>();

            // Mock DBContext for Transaction
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(databaseName: "Test_Orders_Db")
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            var dbContext = new SQLServerDbContext(options);

            _controller = new OrdersController(
                _mockOrderRepo.Object,
                _mockOrderDetailRepo.Object,
                _mockProductRepo.Object,
                dbContext
            );

            // Mock HttpContext & Claims
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "User")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Test]
        public async Task CreateOrder_CalculatesTotalsCorrectly()
        {
            // Arrange
            var dto = new CreateOrderDto
            {
                Items = new List<OrderItemDto>
                {
                    new OrderItemDto { ProductId = 101, Quantity = 2 },
                    new OrderItemDto { ProductId = 102, Quantity = 1 }
                },
                ShippingFee = 30000,
                DiscountAmount = 15000,
                TaxAmount = 0
            };

            // Mock Product 1: Price 100,000, Sale 90,000
            var prod1 = new Product
            {
                Id = 101,
                Name = "Test Product 1",
                ProductVariants = new List<ProductVariant>
                {
                    new ProductVariant { Id = 1, IsActive = true, Price = 100000, SalePrice = 90000, StockQuantity = 10 }
                }
            };

            // Mock Product 2: Price 50,000, no Sale
            var prod2 = new Product
            {
                Id = 102,
                Name = "Test Product 2",
                ProductVariants = new List<ProductVariant>
                {
                    new ProductVariant { Id = 2, IsActive = true, Price = 50000, StockQuantity = 5 }
                }
            };

            _mockProductRepo.Setup(r => r.GetProductWithVariantsAsync(101)).ReturnsAsync(prod1);
            _mockProductRepo.Setup(r => r.GetProductWithVariantsAsync(102)).ReturnsAsync(prod2);

            // Mock Order Add
            _mockOrderRepo.Setup(r => r.AddAsync(It.IsAny<Order>())).Callback<Order>(o => o.Id = 999).Returns(Task.FromResult(new Order()));

            // Act
            var result = await _controller.Create(dto) as CreatedAtActionResult;

            // Assert
            Assert.IsNotNull(result);
            var responseObj = result.Value;
            var orderProp = responseObj.GetType().GetProperty("order").GetValue(responseObj, null) as Order;

            // Subtotal = (90,000 * 2) + (50,000 * 1) = 230,000
            // Total = 230,000 + 30,000 (Ship) - 15,000 (Discount) = 245,000
            Assert.AreEqual(230000, orderProp.Subtotal);
            Assert.AreEqual(30000, orderProp.ShippingFee);
            Assert.AreEqual(15000, orderProp.DiscountAmount);
            Assert.AreEqual(245000, orderProp.TotalAmount);
            
            // Verify Stock update
            Assert.AreEqual(8, prod1.ProductVariants.First().StockQuantity);
            Assert.AreEqual(4, prod2.ProductVariants.First().StockQuantity);
        }
    }
}
