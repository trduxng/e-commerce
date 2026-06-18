using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public interface IProductRepositoryEF : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            bool searchIncludeSubCategories,
            int? manufacturerId,
            int? publishedId,
            bool? isFeatured,
            string? goDirectlyToSku,
            Dictionary<int, List<string>>? specificationFilters,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortField,
            string? sortDir,
            int page,
            int pageSize);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task<Product?> GetProductWithVariantsAsync(long id);
        Task PopulateReviewSummariesAsync(IEnumerable<Product> products);
    }

    public class ProductRepositoryEF : Repository<Product>, IProductRepositoryEF
    {
        public ProductRepositoryEF(SQLServerDbContext context) : base(context)
        {
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            bool searchIncludeSubCategories,
            int? manufacturerId,
            int? publishedId,
            bool? isFeatured,
            string? goDirectlyToSku,
            Dictionary<int, List<string>>? specificationFilters,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortField,
            string? sortDir,
            int page,
            int pageSize)
        {
            // Dựng một IQueryable duy nhất để EF chuyển toàn bộ filter/sort/paging thành SQL.
            var query = _dbSet
                .Include(p => p.Category)
                .Include(p => p.Manufacturer)
                .Include(p => p.ProductVariants)
                .Include(p => p.ProductSpecifications)
                .Where(p => p.DeletedAt == null)
                .AsQueryable();

            if (!string.IsNullOrEmpty(goDirectlyToSku))
            {
                // Tìm chính xác SKU được ưu tiên và bỏ qua các filter tìm kiếm thông thường.
                var sku = goDirectlyToSku.ToLower();
                query = query.Where(p => p.ProductVariants.Any(v => v.Sku.ToLower() == sku));
            }
            else
            {
                if (!string.IsNullOrEmpty(keyword))
                {
                    keyword = keyword.ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(keyword) ||
                        (p.Description != null && p.Description.ToLower().Contains(keyword)));
                }

                if (categoryId.HasValue && categoryId > 0)
                {
                    query = query.Where(p => p.CategoryId == categoryId);
                }

                if (manufacturerId.HasValue && manufacturerId > 0)
                {
                    query = query.Where(p => p.ManufacturerId == manufacturerId);
                }
            }

            if (publishedId.HasValue && publishedId > 0)
            {
                if (publishedId == 1) query = query.Where(p => p.IsActive);
                else if (publishedId == 2) query = query.Where(p => !p.IsActive);
            }

            if (isFeatured.HasValue)
            {
                query = query.Where(p => p.IsFeatured == isFeatured.Value);
            }

            if (specificationFilters != null && specificationFilters.Any())
            {
                // Các attribute khác nhau kết hợp theo AND; nhiều value cùng attribute kết hợp theo OR.
                foreach (var filter in specificationFilters)
                {
                    var attrId = filter.Key;
                    var values = filter.Value;

                    if (values != null && values.Any())
                    {
                        query = query.Where(p => p.ProductSpecifications.Any(ps => 
                            ps.SpecificationAttributeId == attrId && 
                            values.Contains(ps.Value)));
                    }
                }
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p =>
                    (p.ProductVariants.Any() && p.ProductVariants.Min(v => v.SalePrice ?? v.Price) >= minPrice.Value) ||
                    (!p.ProductVariants.Any() && p.BasePrice >= minPrice.Value));
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p =>
                    (p.ProductVariants.Any() && p.ProductVariants.Min(v => v.SalePrice ?? v.Price) <= maxPrice.Value) ||
                    (!p.ProductVariants.Any() && p.BasePrice <= maxPrice.Value));
            }

            var totalCount = await query.CountAsync();

            query = sortField?.ToLower() switch
            {
                "name" => sortDir?.ToLower() == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
                "price" => sortDir?.ToLower() == "asc" ? query.OrderBy(p => p.BasePrice) : query.OrderByDescending(p => p.BasePrice),
                "category" => sortDir?.ToLower() == "asc" ? query.OrderBy(p => p.Category != null ? p.Category.Name : "") : query.OrderByDescending(p => p.Category != null ? p.Category.Name : ""),
                "manufacturer" => sortDir?.ToLower() == "asc" ? query.OrderBy(p => p.Manufacturer != null ? p.Manufacturer.Name : "") : query.OrderByDescending(p => p.Manufacturer != null ? p.Manufacturer.Name : ""),
                _ => sortDir?.ToLower() == "asc" ? query.OrderBy(p => p.Id) : query.OrderByDescending(p => p.Id),
            };

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            await PopulateReviewSummariesAsync(products);
            return (products, totalCount);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            var products = await _dbSet
                .Where(p => p.CategoryId == categoryId && p.DeletedAt == null && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .ToListAsync();

            await PopulateReviewSummariesAsync(products);
            return products;
        }

        public async Task<Product?> GetProductWithVariantsAsync(long id)
        {
            var product = await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Manufacturer)
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (product != null)
                await PopulateReviewSummariesAsync(new[] { product });

            return product;
        }

        public async Task PopulateReviewSummariesAsync(IEnumerable<Product> products)
        {
            // Gom rating của nhiều sản phẩm trong một query, tránh N+1 khi render danh sách.
            var productList = products.ToList();
            var productIds = productList.Select(product => product.Id).Distinct().ToList();
            if (productIds.Count == 0)
                return;

            var summaries = await _context.Reviews
                .Where(review => productIds.Contains(review.ProductId) && review.Status == "approved")
                .GroupBy(review => review.ProductId)
                .Select(group => new
                {
                    ProductId = group.Key,
                    AverageRating = group.Average(review => (decimal)review.Rating),
                    ReviewCount = group.Count()
                })
                .ToDictionaryAsync(summary => summary.ProductId);

            foreach (var product in productList)
            {
                if (summaries.TryGetValue(product.Id, out var summary))
                {
                    product.AverageRating = summary.AverageRating;
                    product.ReviewCount = summary.ReviewCount;
                }
            }
        }
    }
}
