using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckoutAttributesController : ControllerBase
    {
        private readonly SQLServerDbContext _context;

        public CheckoutAttributesController(SQLServerDbContext context)
        {
            _context = context;
        }

        // GET: api/CheckoutAttributes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CheckoutAttribute>>> GetCheckoutAttributes()
        {
            return await _context.CheckoutAttributes
                .Include(x => x.Values)
                .OrderBy(x => x.SortOrder)
                .ToListAsync();
        }

        // POST: api/CheckoutAttributes
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CheckoutAttribute>> CreateAttribute(CheckoutAttribute attribute)
        {
            _context.CheckoutAttributes.Add(attribute);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCheckoutAttributes), new { id = attribute.Id }, attribute);
        }

        // PUT: api/CheckoutAttributes/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateAttribute(int id, CheckoutAttribute attribute)
        {
            if (id != attribute.Id) return BadRequest();
            _context.Entry(attribute).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/CheckoutAttributes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteAttribute(int id)
        {
            var attribute = await _context.CheckoutAttributes.FindAsync(id);
            if (attribute == null) return NotFound();
            _context.CheckoutAttributes.Remove(attribute);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
