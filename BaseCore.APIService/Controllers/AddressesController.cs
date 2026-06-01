using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/addresses")]
    [ApiController]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly SQLServerDbContext _db;

        public AddressesController(SQLServerDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyAddresses()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var addresses = await _db.UserAddresses
                .Where(address => address.UserId == userId)
                .OrderByDescending(address => address.IsDefault)
                .ThenByDescending(address => address.CreatedAt)
                .ToListAsync();

            return Ok(addresses);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserAddressDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var validationMessage = Validate(dto);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            var hasExistingAddress = await _db.UserAddresses.AnyAsync(address => address.UserId == userId);
            var shouldSetDefault = dto.IsDefault || !hasExistingAddress;

            if (shouldSetDefault)
                await ClearDefaultAddress(userId);

            var address = new UserAddress
            {
                UserId = userId,
                ReceiverName = dto.ReceiverName.Trim(),
                Phone = dto.Phone.Trim(),
                Province = dto.Province.Trim(),
                District = dto.District.Trim(),
                Ward = dto.Ward.Trim(),
                AddressDetail = dto.AddressDetail.Trim(),
                IsDefault = shouldSetDefault,
                CreatedAt = DateTime.Now,
            };

            _db.UserAddresses.Add(address);
            await _db.SaveChangesAsync();

            return Created($"/api/addresses/{address.Id}", address);
        }

        [HttpPut("{id:long}/default")]
        public async Task<IActionResult> SetDefault(long id)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

            if (address == null)
                return NotFound(new { message = "Address not found" });

            await ClearDefaultAddress(userId);
            address.IsDefault = true;
            await _db.SaveChangesAsync();

            return Ok(address);
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] CreateUserAddressDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var validationMessage = Validate(dto);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

            if (address == null)
                return NotFound(new { message = "Address not found" });

            if (dto.IsDefault)
                await ClearDefaultAddress(userId);

            address.ReceiverName = dto.ReceiverName.Trim();
            address.Phone = dto.Phone.Trim();
            address.Province = dto.Province.Trim();
            address.District = dto.District.Trim();
            address.Ward = dto.Ward.Trim();
            address.AddressDetail = dto.AddressDetail.Trim();
            address.IsDefault = dto.IsDefault || address.IsDefault;
            await _db.SaveChangesAsync();

            return Ok(address);
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

            if (address == null)
                return NotFound(new { message = "Address not found" });

            var wasDefault = address.IsDefault;
            _db.UserAddresses.Remove(address);
            await _db.SaveChangesAsync();

            if (wasDefault)
            {
                var nextAddress = await _db.UserAddresses
                    .Where(item => item.UserId == userId)
                    .OrderByDescending(item => item.CreatedAt)
                    .FirstOrDefaultAsync();

                if (nextAddress != null)
                {
                    nextAddress.IsDefault = true;
                    await _db.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        private async Task ClearDefaultAddress(long userId)
        {
            var defaultAddresses = await _db.UserAddresses
                .Where(address => address.UserId == userId && address.IsDefault)
                .ToListAsync();

            foreach (var address in defaultAddresses)
                address.IsDefault = false;
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var rawUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(rawUserId, out userId);
        }

        private static string? Validate(CreateUserAddressDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ReceiverName))
                return "Receiver name is required";

            if (string.IsNullOrWhiteSpace(dto.Phone))
                return "Phone is required";

            if (string.IsNullOrWhiteSpace(dto.Province))
                return "Province is required";

            if (string.IsNullOrWhiteSpace(dto.District))
                return "District is required";

            if (string.IsNullOrWhiteSpace(dto.Ward))
                return "Ward is required";

            if (string.IsNullOrWhiteSpace(dto.AddressDetail))
                return "Address detail is required";

            return null;
        }
    }

    public class CreateUserAddressDto
    {
        public string ReceiverName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Province { get; set; } = "";
        public string District { get; set; } = "";
        public string Ward { get; set; } = "";
        public string AddressDetail { get; set; } = "";
        public bool IsDefault { get; set; }
    }
}
