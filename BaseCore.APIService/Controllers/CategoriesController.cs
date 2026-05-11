using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Category API Controller
    /// Teaching: RESTful API, CRUD Operations (Bài 10)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepositoryEF _categoryRepository;

        public CategoriesController(ICategoryRepositoryEF categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        /// <summary>
        /// Get all categories
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            if (page.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(keyword))
            {
                var safePage = Math.Max(1, page ?? 1);
                var safePageSize = Math.Clamp(pageSize ?? 10, 1, 100);
                var (items, totalCount) = await _categoryRepository.SearchAsync(keyword, safePage, safePageSize);

                return Ok(new
                {
                    items,
                    totalCount,
                    page = safePage,
                    pageSize = safePageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / safePageSize)
                });
            }

            var categories = await _categoryRepository.GetAllAsync();
            return Ok(categories);
        }

        /// <summary>
        /// Get category by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            return Ok(category);
        }

        /// <summary>
        /// Create new category
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CategoryDto dto)
        {
            var existing = await _categoryRepository.GetByNameAsync(dto.Name);
            if (existing != null)
                return BadRequest(new { message = "Category name already exists" });

            var category = new Category
            {
                Name = dto.Name,
                Slug = string.IsNullOrWhiteSpace(dto.Slug) ? Slugify(dto.Name) : dto.Slug,
                Description = dto.Description ?? "",
                ParentId = dto.ParentId,
                ImageUrl = dto.ImageUrl,
                IsActive = dto.IsActive ?? true,
                SortOrder = dto.SortOrder ?? 0
            };

            await _categoryRepository.AddAsync(category);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        /// <summary>
        /// Update category
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            category.Name = dto.Name ?? category.Name;
            if (!string.IsNullOrWhiteSpace(dto.Name) && string.IsNullOrWhiteSpace(dto.Slug))
                category.Slug = Slugify(dto.Name);
            category.Slug = dto.Slug ?? category.Slug;
            category.Description = dto.Description ?? category.Description;
            category.ParentId = dto.ParentId ?? category.ParentId;
            category.ImageUrl = dto.ImageUrl ?? category.ImageUrl;
            category.IsActive = dto.IsActive ?? category.IsActive;
            category.SortOrder = dto.SortOrder ?? category.SortOrder;

            await _categoryRepository.UpdateAsync(category);
            return Ok(category);
        }

        /// <summary>
        /// Delete category
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            category.IsActive = false;
            await _categoryRepository.UpdateAsync(category);
            return Ok(new { message = "Category deleted successfully" });
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

    public class CategoryDto
    {
        public string Name { get; set; } = "";
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public int? ParentId { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
        public int? SortOrder { get; set; }
    }
}
