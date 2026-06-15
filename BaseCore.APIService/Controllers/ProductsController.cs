using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly BaseCore.Repository.SQLServerDbContext _context;

        public ProductsController(IProductRepositoryEF productRepository, ICategoryRepositoryEF categoryRepository, BaseCore.Repository.SQLServerDbContext context)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _context = context;
        }

        /// <summary>
        /// Get all products with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] int? manufacturerId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var specFilters = new Dictionary<int, List<string>>();
            foreach (var key in Request.Query.Keys)
            {
                if (key.StartsWith("s_") && int.TryParse(key.Substring(2), out int attrId))
                {
                    var values = Request.Query[key].ToString().Split(',').ToList();
                    specFilters[attrId] = values;
                }
            }

            var (products, totalCount) = await _productRepository.SearchAsync(
                keyword, 
                categoryId, 
                manufacturerId, 
                specFilters.Any() ? specFilters : null,
                minPrice, 
                maxPrice, 
                page, 
                pageSize);

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

            var variants = BuildCreateVariants(dto, out var validationError);
            if (validationError != null)
                return BadRequest(new { message = validationError });

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
                ProductVariants = variants
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
            product.IsDigital = dto.IsDigital ?? product.IsDigital;
            product.DownloadUrl = dto.DownloadUrl ?? product.DownloadUrl;
            product.IsRental = dto.IsRental ?? product.IsRental;
            product.RentalPriceLength = dto.RentalPriceLength ?? product.RentalPriceLength;
            product.RentalPricePeriod = dto.RentalPricePeriod ?? product.RentalPricePeriod;

            if (product.IsActive)
                product.DeletedAt = null;
            product.UpdatedAt = DateTime.Now;

            if (dto.Variants != null)
            {
                var validationError = ApplyVariantUpdates(product, dto);
                if (validationError != null)
                    return BadRequest(new { message = validationError });
            }
            else
            {
                var variant = product.ProductVariants.FirstOrDefault();
                if (variant == null)
                {
                    variant = new ProductVariant
                    {
                        Sku = string.IsNullOrWhiteSpace(dto.Sku) ? $"SKU-{Guid.NewGuid():N}" : dto.Sku.Trim(),
                        Price = dto.Price ?? product.BasePrice,
                        StockQuantity = dto.Stock ?? 0,
                        ImageUrl = dto.ImageUrl ?? product.ImageUrl,
                        IsActive = dto.IsActive ?? product.IsActive
                    };
                    product.ProductVariants.Add(variant);
                }
                else
                {
                    variant.Sku = string.IsNullOrWhiteSpace(dto.Sku) ? variant.Sku : dto.Sku.Trim();
                    variant.Price = dto.Price ?? variant.Price;
                    variant.SalePrice = dto.SalePrice;
                    variant.StockQuantity = dto.Stock ?? variant.StockQuantity;
                    variant.Size = dto.Size ?? variant.Size;
                    variant.Color = dto.Color ?? variant.Color;
                    variant.ImageUrl = dto.ImageUrl ?? variant.ImageUrl;
                    variant.IsActive = dto.IsActive ?? variant.IsActive;
                }
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

        [HttpPut("{id}/specifications")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateSpecifications(long id, [FromBody] List<ProductSpecificationDto> specs)
        {
            var product = await _context.Products
                .Include(p => p.ProductSpecifications)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            // Remove existing specs
            _context.ProductSpecifications.RemoveRange(product.ProductSpecifications);

            // Add new specs
            if (specs != null)
            {
                foreach (var spec in specs)
                {
                    product.ProductSpecifications.Add(new ProductSpecification
                    {
                        SpecificationAttributeId = spec.AttributeId,
                        Value = spec.Value,
                        SortOrder = spec.SortOrder
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(product.ProductSpecifications);
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

        private static List<ProductVariant> BuildCreateVariants(ProductCreateDto dto, out string? validationError)
        {
            var variantDtos = dto.Variants?.Count > 0
                ? dto.Variants
                : new List<ProductVariantDto>
                {
                    new()
                    {
                        Sku = dto.Sku,
                        Price = dto.Price,
                        SalePrice = dto.SalePrice,
                        StockQuantity = dto.Stock,
                        Size = dto.Size,
                        Color = dto.Color,
                        ImageUrl = dto.ImageUrl,
                        IsActive = dto.IsActive
                    }
                };

            var variants = new List<ProductVariant>();
            validationError = ValidateVariantDtos(variantDtos, dto.Price, dto.IsActive, out var normalizedVariants);
            if (validationError != null)
                return variants;

            foreach (var variantDto in normalizedVariants)
            {
                variants.Add(new ProductVariant
                {
                    Sku = string.IsNullOrWhiteSpace(variantDto.Sku) ? $"SKU-{Guid.NewGuid():N}" : variantDto.Sku.Trim(),
                    Price = variantDto.Price ?? dto.Price,
                    SalePrice = variantDto.SalePrice,
                    StockQuantity = variantDto.StockQuantity ?? variantDto.Stock ?? 0,
                    Size = NormalizeOptionalText(variantDto.Size),
                    Color = NormalizeOptionalText(variantDto.Color),
                    ImageUrl = NormalizeOptionalText(variantDto.ImageUrl),
                    IsActive = variantDto.IsActive ?? dto.IsActive
                });
            }

            return variants;
        }

        private static string? ApplyVariantUpdates(Product product, ProductUpdateDto dto)
        {
            if (dto.Variants == null || dto.Variants.Count == 0)
                return "Product must contain at least one variant.";

            var fallbackPrice = dto.Price ?? product.BasePrice;
            var validationError = ValidateVariantDtos(dto.Variants, fallbackPrice, product.IsActive, out var normalizedVariants);
            if (validationError != null)
                return validationError;

            var existingById = product.ProductVariants.ToDictionary(variant => variant.Id);
            var postedExistingIds = new HashSet<long>();

            foreach (var variantDto in normalizedVariants)
            {
                ProductVariant variant;
                if (variantDto.Id.HasValue && variantDto.Id.Value > 0)
                {
                    if (!existingById.TryGetValue(variantDto.Id.Value, out var existingVariant))
                        return "One or more variants do not belong to this product.";

                    variant = existingVariant;
                    postedExistingIds.Add(variant.Id);
                }
                else
                {
                    variant = new ProductVariant();
                    product.ProductVariants.Add(variant);
                }

                variant.Sku = string.IsNullOrWhiteSpace(variantDto.Sku) ? variant.Sku : variantDto.Sku.Trim();
                if (string.IsNullOrWhiteSpace(variant.Sku))
                    variant.Sku = $"SKU-{Guid.NewGuid():N}";

                variant.Price = variantDto.Price ?? fallbackPrice;
                variant.SalePrice = variantDto.SalePrice;
                variant.StockQuantity = variantDto.StockQuantity ?? variantDto.Stock ?? variant.StockQuantity;
                variant.Size = NormalizeOptionalText(variantDto.Size);
                variant.Color = NormalizeOptionalText(variantDto.Color);
                variant.ImageUrl = NormalizeOptionalText(variantDto.ImageUrl);
                variant.IsActive = variantDto.IsActive ?? true;
            }

            foreach (var variant in product.ProductVariants.Where(variant => variant.Id > 0 && !postedExistingIds.Contains(variant.Id)))
                variant.IsActive = false;

            if (product.IsActive && !product.ProductVariants.Any(variant => variant.IsActive))
                return "Active products must contain at least one active variant.";

            return null;
        }

        private static string? ValidateVariantDtos(
            List<ProductVariantDto> variantDtos,
            decimal fallbackPrice,
            bool requireActiveVariant,
            out List<ProductVariantDto> normalizedVariants)
        {
            normalizedVariants = variantDtos;
            if (variantDtos.Count == 0)
                return "Product must contain at least one variant.";

            var duplicateSku = variantDtos
                .Select(variant => variant.Sku?.Trim())
                .Where(sku => !string.IsNullOrWhiteSpace(sku))
                .GroupBy(sku => sku!, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(group => group.Count() > 1);

            if (duplicateSku != null)
                return $"SKU {duplicateSku.Key} is duplicated in the variant list.";

            for (var index = 0; index < variantDtos.Count; index++)
            {
                var variant = variantDtos[index];
                var price = variant.Price ?? fallbackPrice;
                var stock = variant.StockQuantity ?? variant.Stock ?? 0;

                if (price <= 0)
                    return $"Variant #{index + 1} price must be greater than zero.";

                if (stock < 0)
                    return $"Variant #{index + 1} stock must be zero or greater.";

                if (variant.SalePrice.HasValue && (variant.SalePrice.Value < 0 || variant.SalePrice.Value > price))
                    return $"Variant #{index + 1} sale price must be between zero and the regular price.";
            }

            if (requireActiveVariant && !variantDtos.Any(variant => variant.IsActive != false))
                return "Product must contain at least one active variant.";

            return null;
        }

        private static string? NormalizeOptionalText(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
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
        public int? ManufacturerId { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Sku { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public List<ProductVariantDto>? Variants { get; set; }
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
        public int? ManufacturerId { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Sku { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public List<ProductVariantDto>? Variants { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
    }

    public class ProductVariantDto
    {
        public long? Id { get; set; }
        public string? Sku { get; set; }
        public decimal? Price { get; set; }
        public decimal? SalePrice { get; set; }
        public int? StockQuantity { get; set; }
        public int? Stock { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ProductSpecificationDto
    {
        public int AttributeId { get; set; }
        public string Value { get; set; } = "";
        public int SortOrder { get; set; }
    }
}
     public string Value { get; set; } = "";
        public int SortOrder { get; set; }
    }
}
