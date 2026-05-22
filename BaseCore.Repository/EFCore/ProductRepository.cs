using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public interface IProductRepositoryEF : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, int page, int pageSize);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task<Product?> GetProductWithVariantsAsync(long id);
    }

    public class ProductRepositoryEF : Repository<Product>, IProductRepositoryEF
    {
        public ProductRepositoryEF(SQLServerDbContext context) : base(context)
        {
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, int page, int pageSize)
        {
            var query = _dbSet
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
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

            return (products, totalCount);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(p => p.CategoryId == categoryId && p.DeletedAt == null && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .ToListAsync();
        }

        public async Task<Product?> GetProductWithVariantsAsync(long id)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);
        }
    }
}
