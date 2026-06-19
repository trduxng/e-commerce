using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class ProductSearchTests
    {
        private SQLServerDbContext _db = null!;
        private ProductRepositoryEF _repository = null!;

        [SetUp]
        public async Task Setup()
        {
            var options = new DbContextOptionsBuilder<SQLServerDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new SQLServerDbContext(options);
            _repository = new ProductRepositoryEF(_db);

            _db.Categories.AddRange(
                new Category { Id = 1, Name = "Điện thoại", Slug = "dien-thoai" },
                new Category { Id = 2, Name = "Máy tính", Slug = "may-tinh" });

            _db.Products.AddRange(
                new Product
                {
                    Id = 1,
                    Name = "Điện thoại Alpha",
                    Slug = "dien-thoai-alpha",
                    CategoryId = 1,
                    BasePrice = 9000000,
                    ProductVariants =
                    {
                        new ProductVariant
                        {
                            Id = 1,
                            Sku = "ALPHA-CHEAP",
                            Price = 5000000,
                            StockQuantity = 1
                        },
                        new ProductVariant
                        {
                            Id = 2,
                            Sku = "ALPHA-PRO",
                            Price = 12000000,
                            SalePrice = 10000000,
                            StockQuantity = 1
                        }
                    }
                },
                new Product
                {
                    Id = 2,
                    Name = "Điện thoại Beta",
                    Slug = "dien-thoai-beta",
                    CategoryId = 1,
                    BasePrice = 7000000
                },
                new Product
                {
                    Id = 3,
                    Name = "Máy tính Alpha",
                    Slug = "may-tinh-alpha",
                    CategoryId = 2,
                    BasePrice = 10000000
                });

            await _db.SaveChangesAsync();
        }

        [TearDown]
        public void TearDown()
        {
            _db.Dispose();
        }

        [Test]
        public async Task SearchAsync_FiltersByNameCategoryAndPriceRangeOnBackend()
        {
            var (products, totalCount) = await Search(
                keyword: "  ALPHA ",
                categoryId: 1,
                minPrice: 9000000,
                maxPrice: 11000000);

            Assert.Multiple(() =>
            {
                Assert.That(totalCount, Is.EqualTo(1));
                Assert.That(products.Select(product => product.Id), Is.EqualTo(new long[] { 1 }));
            });
        }

        [Test]
        public async Task SearchAsync_PriceRangeMatchesAnyVariantWithinTheRange()
        {
            var (products, totalCount) = await Search(
                minPrice: 9000000,
                maxPrice: 11000000);

            Assert.Multiple(() =>
            {
                Assert.That(totalCount, Is.EqualTo(2));
                Assert.That(products.Select(product => product.Id), Is.EquivalentTo(new long[] { 1, 3 }));
            });
        }

        private Task<(List<Product> Products, int TotalCount)> Search(
            string? keyword = null,
            int? categoryId = null,
            decimal? minPrice = null,
            decimal? maxPrice = null)
        {
            return _repository.SearchAsync(
                keyword,
                categoryId,
                searchIncludeSubCategories: false,
                manufacturerId: null,
                publishedId: null,
                isFeatured: null,
                goDirectlyToSku: null,
                specificationFilters: null,
                minPrice,
                maxPrice,
                sortField: "id",
                sortDir: "asc",
                page: 1,
                pageSize: 20);
        }
    }
}
