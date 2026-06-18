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

            var existingAttribute = await _context.CheckoutAttributes
                .Include(x => x.Values)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (existingAttribute == null)
            {
                return NotFound();
            }

            // Cập nhật entity cha nhưng đồng bộ collection Values thủ công để EF xử lý đúng add/update/delete.
            _context.Entry(existingAttribute).CurrentValues.SetValues(attribute);

            // Value không còn trong payload được xem là đã bị xóa khỏi form quản trị.
            var incomingIds = attribute.Values.Select(v => v.Id).ToList();
            var toRemove = existingAttribute.Values.Where(v => !incomingIds.Contains(v.Id)).ToList();
            foreach (var val in toRemove)
            {
                _context.CheckoutAttributeValues.Remove(val);
            }

            // ID có sẵn thì cập nhật; ID bằng 0 tạo lựa chọn mới.
            foreach (var val in attribute.Values)
            {
                var existingVal = existingAttribute.Values.FirstOrDefault(v => v.Id == val.Id && val.Id != 0);
                if (existingVal != null)
                {
                    _context.Entry(existingVal).CurrentValues.SetValues(val);
                }
                else
                {
                    existingAttribute.Values.Add(new CheckoutAttributeValue
                    {
                        Name = val.Name,
                        PriceAdjustment = val.PriceAdjustment,
                        IsPreSelected = val.IsPreSelected,
                        SortOrder = val.SortOrder
                    });
                }
            }

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
