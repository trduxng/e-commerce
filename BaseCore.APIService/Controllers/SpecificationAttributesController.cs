using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SpecificationAttributesController : ControllerBase
    {
        private readonly SQLServerDbContext _context;

        public SpecificationAttributesController(SQLServerDbContext context)
        {
            _context = context;
        }

        // GET: api/SpecificationAttributes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SpecificationAttribute>>> GetSpecificationAttributes()
        {
            return await _context.SpecificationAttributes
                .OrderBy(x => x.SortOrder)
                .ToListAsync();
        }

        // POST: api/SpecificationAttributes
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SpecificationAttribute>> CreateAttribute(SpecificationAttribute attribute)
        {
            _context.SpecificationAttributes.Add(attribute);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSpecificationAttributes), new { id = attribute.Id }, attribute);
        }

        // PUT: api/SpecificationAttributes/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateAttribute(int id, SpecificationAttribute attribute)
        {
            if (id != attribute.Id) return BadRequest();
            _context.Entry(attribute).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/SpecificationAttributes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteAttribute(int id)
        {
            var attribute = await _context.SpecificationAttributes.FindAsync(id);
            if (attribute == null) return NotFound();
            _context.SpecificationAttributes.Remove(attribute);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
