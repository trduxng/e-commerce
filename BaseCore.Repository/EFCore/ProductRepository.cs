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
            int? manufacturerId,
            Dictionary<int, List<string>>? specificationFilters,
            decimal? minPrice,
            decimal? maxPrice,
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
            int? manufacturerId,
            Dictionary<int, List<string>>? specificationFilters,
            decimal? minPrice,
            decimal? maxPrice,
            int page,
            int pageSize)
        {
            var query = _dbSet
                .Include(p => p.Category)
                .Include(p => p.Manufacturer)
                .Include(p => p.ProductVariants)
                .Include(p => p.ProductSpecifications)
                .Where(p => p.DeletedAt == null && p.IsActive)
                .AsQueryable();

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

            if (specificationFilters != null && specificationFilters.Any())
            {
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

            var products = await query
                .OrderByDescending(p => p.Id)
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
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (product != null)
                await PopulateReviewSummariesAsync(new[] { product });

            return product;
        }

        public async Task PopulateReviewSummariesAsync(IEnumerable<Product> products)
        {
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
