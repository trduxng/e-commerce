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
using NUnit.Framework;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class ProductVariantManagementTests
    {
        private SQLServerDbContext _db = null!;
        private ProductsController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new SQLServerDbContext(options);
            _controller = new ProductsController(
                new ProductRepositoryEF(_db),
                new CategoryRepositoryEF(_db),
                _db);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "1"),
                        new Claim(ClaimTypes.Role, "Admin")
                    }, "mock"))
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _db.Dispose();
        }

        [Test]
        public async Task Update_RemovesOmittedVariant_WhenItHasNoReferences()
        {
            var seeded = await SeedProduct();

            var result = await _controller.Update(
                seeded.ProductId,
                CreateUpdateDto(seeded.KeptVariantId));

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            _db.ChangeTracker.Clear();
            Assert.That(
                await _db.ProductVariants.AnyAsync(variant => variant.Id == seeded.RemovedVariantId),
                Is.False);
            Assert.That(
                await _db.ProductVariants.CountAsync(variant => variant.ProductId == seeded.ProductId),
                Is.EqualTo(1));
        }

        [Test]
        public async Task Update_HidesOmittedVariant_WhenOrderHistoryReferencesIt()
        {
            var seeded = await SeedProduct();
            _db.Orders.Add(new Order
            {
                OrderCode = "ORD-VARIANT-HISTORY",
                ReceiverName = "Customer",
                ReceiverPhone = "0900000000",
                ShippingAddressFull = "Test address",
                PaymentMethod = "cod",
                PaymentStatus = "paid",
                OrderStatus = "delivered",
                OrderDetails = new List<OrderDetail>
                {
                    new()
                    {
                        ProductVariantId = seeded.RemovedVariantId,
                        ProductNameSnapshot = "Variant Test Product",
                        SkuSnapshot = "VARIANT-OLD",
                        Quantity = 1,
                        UnitPrice = 100000,
                        TotalPrice = 100000
                    }
                }
            });
            await _db.SaveChangesAsync();

            var result = await _controller.Update(
                seeded.ProductId,
                CreateUpdateDto(seeded.KeptVariantId));

            Assert.That(result, Is.TypeOf<OkObjectResult>());
            _db.ChangeTracker.Clear();
            var archivedVariant = await _db.ProductVariants
                .SingleAsync(variant => variant.Id == seeded.RemovedVariantId);
            Assert.That(archivedVariant.IsActive, Is.False);
        }

        private async Task<(long ProductId, long KeptVariantId, long RemovedVariantId)> SeedProduct()
        {
            var product = new Product
            {
                Name = "Variant Test Product",
                Slug = "variant-test-product",
                CategoryId = 1,
                BasePrice = 100000,
                IsActive = true,
                ProductVariants = new List<ProductVariant>
                {
                    new()
                    {
                        Sku = "VARIANT-ACTIVE",
                        Price = 100000,
                        StockQuantity = 10,
                        IsActive = true
                    },
                    new()
                    {
                        Sku = "VARIANT-OLD",
                        Price = 100000,
                        StockQuantity = 5,
                        IsActive = true
                    }
                }
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            return (
                product.Id,
                product.ProductVariants[0].Id,
                product.ProductVariants[1].Id);
        }

        private static ProductUpdateDto CreateUpdateDto(long keptVariantId)
        {
            return new ProductUpdateDto
            {
                Name = "Variant Test Product",
                Price = 100000,
                IsActive = true,
                Variants = new List<ProductVariantDto>
                {
                    new()
                    {
                        Id = keptVariantId,
                        Sku = "VARIANT-ACTIVE",
                        Price = 100000,
                        StockQuantity = 10,
                        IsActive = true
                    }
                }
            };
        }
    }
}
