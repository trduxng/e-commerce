using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Product API Controller
    /// Teaching: RESTful API, CRUD Operations, EF Core (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepositoryEF _productRepository;
        private readonly ICategoryRepositoryEF _categoryRepository;

        public ProductsController(IProductRepositoryEF productRepository, ICategoryRepositoryEF categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        /// <summary>
        /// Get all products with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (products, totalCount) = await _productRepository.SearchAsync(keyword, categoryId, minPrice, maxPrice, page, pageSize);

            return Ok(new
            {
                items = products,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get product by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var product = await _productRepository.GetProductWithVariantsAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        /// <summary>

        /// Create new product (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]

        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            // Validate category exists
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Category not found" });

            var product = new Product
            {
                Name = dto.Name,
                Slug = string.IsNullOrWhiteSpace(dto.Slug) ? Slugify(dto.Name) : dto.Slug,
                BasePrice = dto.Price,
                CategoryId = dto.CategoryId,
                ShortDescription = dto.ShortDescription,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl ?? "",
                IsActive = dto.IsActive,
                IsFeatured = dto.IsFeatured,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                ProductVariants = new List<ProductVariant>
                {
                    new()
                    {
                        Sku = string.IsNullOrWhiteSpace(dto.Sku) ? $"SKU-{Guid.NewGuid():N}" : dto.Sku,
                        Price = dto.Price,
                        SalePrice = dto.SalePrice,
                        StockQuantity = dto.Stock,
                        Size = dto.Size,
                        Color = dto.Color,
                        ImageUrl = dto.ImageUrl,
                        IsActive = dto.IsActive
                    }
                }
            };

            await _productRepository.AddAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        /// <summary>

        /// Update product (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]

        public async Task<IActionResult> Update(long id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _productRepository.GetProductWithVariantsAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Name = dto.Name ?? product.Name;
            if (!string.IsNullOrWhiteSpace(dto.Name) && string.IsNullOrWhiteSpace(dto.Slug))
                product.Slug = Slugify(dto.Name);
            product.Slug = dto.Slug ?? product.Slug;
            product.BasePrice = dto.Price ?? product.BasePrice;
            product.CategoryId = dto.CategoryId ?? product.CategoryId;
            product.ShortDescription = dto.ShortDescription ?? product.ShortDescription;
            product.Description = dto.Description ?? product.Description;
            product.ImageUrl = dto.ImageUrl ?? product.ImageUrl;
            product.IsActive = dto.IsActive ?? product.IsActive;
            product.IsFeatured = dto.IsFeatured ?? product.IsFeatured;
            if (product.IsActive)
                product.DeletedAt = null;
            product.UpdatedAt = DateTime.Now;

            var variant = product.ProductVariants.FirstOrDefault();
            if (variant == null)
            {
                variant = new ProductVariant
                {
                    Sku = string.IsNullOrWhiteSpace(dto.Sku) ? $"SKU-{Guid.NewGuid():N}" : dto.Sku,
                    Price = dto.Price ?? product.BasePrice,
                    StockQuantity = dto.Stock ?? 0,
                    ImageUrl = dto.ImageUrl ?? product.ImageUrl,
                    IsActive = dto.IsActive ?? product.IsActive
                };
                product.ProductVariants.Add(variant);
            }
            else
            {
                variant.Sku = dto.Sku ?? variant.Sku;
                variant.Price = dto.Price ?? variant.Price;
                variant.SalePrice = dto.SalePrice;
                variant.StockQuantity = dto.Stock ?? variant.StockQuantity;
                variant.Size = dto.Size ?? variant.Size;
                variant.Color = dto.Color ?? variant.Color;
                variant.ImageUrl = dto.ImageUrl ?? variant.ImageUrl;
                variant.IsActive = dto.IsActive ?? variant.IsActive;
            }

            await _productRepository.UpdateAsync(product);
            return Ok(product);
        }

        /// <summary>

        /// Delete product (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(long id)
        {
            var product = await _productRepository.GetProductWithVariantsAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.IsActive = false;
            product.DeletedAt = DateTime.Now;
            await _productRepository.UpdateAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        /// <summary>
        /// Get products by category
        /// </summary>
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return Ok(products);
        }

        private static string Slugify(string value)
        {
            var slug = new string(value.Trim().ToLowerInvariant()
                .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
                .ToArray());

            while (slug.Contains("--"))
                slug = slug.Replace("--", "-");

            return slug.Trim('-');
        }
    }

    // DTOs
    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public string? Slug { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Sku { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; }
    }

    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public decimal? Price { get; set; }
        public int? Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Sku { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
    }

}
