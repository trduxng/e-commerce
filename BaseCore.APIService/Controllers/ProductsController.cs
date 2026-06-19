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
        private readonly IWebHostEnvironment _environment;

        public ProductsController(
            IProductRepositoryEF productRepository,
            ICategoryRepositoryEF categoryRepository,
            BaseCore.Repository.SQLServerDbContext context,
            IWebHostEnvironment environment)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _context = context;
            _environment = environment;
        }

        [HttpPost("upload-image")]
        [Authorize(Roles = "Admin,Manager,manager")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select an image." });

            const long maxFileSize = 5 * 1024 * 1024;
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "Image size must not exceed 5 MB." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".jpg", ".jpeg", ".png", ".webp"
            };

            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Only JPG, JPEG, PNG and WEBP images are supported." });

            var uploadFolder = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "products");
            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await file.CopyToAsync(stream);

            return Ok(new { url = $"/api/products/images/{fileName}" });
        }

        [HttpGet("images/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetImage(string fileName)
        {
            var safeFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "products",
                safeFileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var contentType = Path.GetExtension(safeFileName).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            };

            return PhysicalFile(filePath, contentType);
        }

        /// <summary>
        /// Get all products with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] bool searchIncludeSubCategories,
            [FromQuery] int? manufacturerId,
            [FromQuery] int? publishedId,
            [FromQuery] bool? isFeatured,
            [FromQuery] string? goDirectlyToSku,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? sortField = "id",
            [FromQuery] string? sortDir = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            keyword = string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();
            categoryId = categoryId > 0 ? categoryId : null;

            if (minPrice < 0 || maxPrice < 0)
                return BadRequest(new { message = "Product price cannot be negative." });

            if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
                return BadRequest(new { message = "Minimum price cannot be greater than maximum price." });

            // Khách hàng luôn chỉ thấy sản phẩm active; chỉ Admin và Manager được lọc cả sản phẩm ẩn.
            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") && !User.IsInRole("manager"))
            {
                publishedId = 1;
            }

            // Query dạng s_{attributeId}=value1,value2 được chuyển thành bộ lọc thông số động.
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
                searchIncludeSubCategories,
                manufacturerId,
                publishedId,
                isFeatured,
                goDirectlyToSku,
                specFilters.Any() ? specFilters : null,
                minPrice,
                maxPrice,
                sortField,
                sortDir,
                page,
                pageSize);
            var allProducts = await _context.Products
          .Include(p => p.ProductVariants)
          .Where(p => p.DeletedAt == null)
          .ToListAsync();

            var totalStock = allProducts.Sum(p => p.Stock);

            var averagePrice = totalStock > 0
                ? allProducts.Sum(p => p.Price * p.Stock) / totalStock
                : 0;

            return Ok(new
            {
                items = products,
                totalCount,
                averagePrice,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get product by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id, [FromQuery] bool includeInactive = false)
        {
            var product = await _productRepository.GetProductWithVariantsAsync(id);
            var canViewInactive = includeInactive && (User.IsInRole("Admin") || User.IsInRole("Manager") || User.IsInRole("manager"));
            if (product == null || (!product.IsActive && !canViewInactive))
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        /// <summary>

        /// Create new product (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager,manager")]

        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            // Validate category exists
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Category not found" });

            // Luôn chuẩn hóa về danh sách variant, kể cả form cũ chỉ gửi một SKU/stock.
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
        [Authorize(Roles = "Admin,Manager,manager")]

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
                // Payload variant mới có thể thêm, sửa và vô hiệu hóa variant cũ trong một lần cập nhật.
                var validationError = await ApplyVariantUpdatesAsync(product, dto);
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

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        /// <summary>

        /// Delete product (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager,manager")]
        public async Task<IActionResult> Delete(long id)
        {
            var product = await _productRepository.GetProductWithVariantsAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            // Soft-delete để OrderDetail cũ vẫn truy xuất được ProductVariant liên quan.
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

            // Thay toàn bộ danh sách giúp frontend gửi đúng trạng thái cuối của form.
            _context.ProductSpecifications.RemoveRange(product.ProductSpecifications);

            // Tạo lại các specification được người quản trị giữ lại/chỉnh sửa.
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

        /// <summary>
        /// Get product reviews
        /// </summary>
        [HttpGet("{id}/reviews")]
        public async Task<IActionResult> GetReviews(long id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductId == id && r.Status == "approved");

            var totalCount = await query.CountAsync();

            var allRatings = await query.Select(r => (double)r.Rating).ToListAsync();
            var breakdown = new List<object>();
            for (int i = 5; i >= 1; i--)
            {
                var count = allRatings.Count(r => r == i);
                breakdown.Add(new { stars = i, count = count, percentage = totalCount > 0 ? (count * 100.0 / totalCount) : 0 });
            }

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Title,
                    r.Content,
                    r.CreatedAt,
                    r.IsVerifiedPurchase,
                    reviewerName = r.User != null ? r.User.Name : "Anonymous"
                })
                .ToListAsync();

            return Ok(new
            {
                averageRating = totalCount > 0 ? allRatings.Average() : 0,
                totalCount,
                breakdown,
                items,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        /// <summary>
        /// Add product review
        /// </summary>
        [HttpPost("{id}/reviews")]
        [Authorize]
        public async Task<IActionResult> AddReview(long id, [FromBody] ReviewCreateDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User not found in token" });
            }

            var review = new Review
            {
                ProductId = id,
                UserId = userId,
                Rating = (byte)dto.Rating,
                Title = dto.Title ?? "",
                Content = dto.Content,
                Status = "pending", // Default status for new reviews
                CreatedAt = DateTime.Now,
                IsVerifiedPurchase = true // Typically you'd verify this against actual orders
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(review);
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
            // Hỗ trợ cả DTO mới nhiều variant và DTO cũ một variant.
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

        private async Task<string?> ApplyVariantUpdatesAsync(Product product, ProductUpdateDto dto)
        {
            if (dto.Variants == null || dto.Variants.Count == 0)
                return "Product must contain at least one variant.";

            var fallbackPrice = dto.Price ?? product.BasePrice;
            var validationError = ValidateVariantDtos(dto.Variants, fallbackPrice, product.IsActive, out var normalizedVariants);
            if (validationError != null)
                return validationError;

            // ID variant phải thuộc product hiện tại; variant bị bỏ khỏi payload sẽ được vô hiệu hóa.
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

            var removedVariants = product.ProductVariants
                .Where(variant => variant.Id > 0 && !postedExistingIds.Contains(variant.Id))
                .ToList();

            if (removedVariants.Count > 0)
            {
                var removedIds = removedVariants.Select(variant => variant.Id).ToList();
                var referencedIds = (await _context.OrderDetails
                        .Where(detail => removedIds.Contains(detail.ProductVariantId))
                        .Select(detail => detail.ProductVariantId)
                        .Distinct()
                        .ToListAsync())
                    .ToHashSet();

                referencedIds.UnionWith(await _context.CartItems
                    .Where(item => removedIds.Contains(item.ProductVariantId))
                    .Select(item => item.ProductVariantId)
                    .Distinct()
                    .ToListAsync());

                foreach (var variant in removedVariants)
                {
                    if (referencedIds.Contains(variant.Id))
                    {
                        variant.IsActive = false;
                    }
                    else
                    {
                        product.ProductVariants.Remove(variant);
                        _context.ProductVariants.Remove(variant);
                    }
                }
            }

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
            // Kiểm tra invariant quan trọng trước khi EF thay đổi entity graph.
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
        public bool IsDigital { get; set; }
        public string? DownloadUrl { get; set; }
        public bool IsRental { get; set; }
        public int? RentalPriceLength { get; set; }
        public string? RentalPricePeriod { get; set; }
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
        public bool? IsDigital { get; set; }
        public string? DownloadUrl { get; set; }
        public bool? IsRental { get; set; }
        public int? RentalPriceLength { get; set; }
        public string? RentalPricePeriod { get; set; }
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

    public class ReviewCreateDto
    {
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = "";
    }
}
