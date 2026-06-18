using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository.Authen
{
    public interface IUserRepository
    {
        Task<User> GetByUsernameAsync(string username);
        Task<User> GetByIdAsync(string id);
        Task<List<User>> GetAllAsync();
        Task CreateAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(string id);
        Task<(List<User> Users, int TotalCount)> SearchAsync(string keyword, int page, int pageSize);
        Task<(List<User> Users, int TotalCount)> SearchAsync(
            string? keyword,
            string? email,
            string? username,
            string? firstName,
            string? lastName,
            string? phone,
            string? company,
            string? ipAddress,
            string? zipPostalCode,
            bool? isActive,
            int[] userTypes,
            DateTime? registrationFrom,
            DateTime? registrationTo,
            string sortField,
            string sortDir,
            int page,
            int pageSize);
    }

    public class UserRepository : IUserRepository
    {
        private readonly SQLServerDbContext _context;

        public UserRepository(SQLServerDbContext context)
        {
            _context = context;
        }

        public async Task<User> GetByUsernameAsync(string username)
        {
            // Tham số tên username nhưng hệ thống hiện đăng nhập bằng cột Email.
            return await _context.Users
                .Where(u => u.Email == username && u.Status == "active" && u.DeletedAt == null)
                .FirstOrDefaultAsync();
        }

        public async Task<User> GetByIdAsync(string id)
        {
            if (!long.TryParse(id, out var userId))
            {
                return null;
            }

            return await _context.Users
                .Where(u => u.Id == userId && u.DeletedAt == null)
                .FirstOrDefaultAsync();
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users
                .Where(u => u.Status == "active" && u.DeletedAt == null)
                .ToListAsync();
        }

        public async Task CreateAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string id)
        {
            if (!long.TryParse(id, out var userId))
            {
                return;
            }

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                // Soft-delete user để giữ quan hệ với đơn hàng và dữ liệu lịch sử.
                user.Status = "banned";
                user.DeletedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<User> Users, int TotalCount)> SearchAsync(string keyword, int page, int pageSize)
        {
            return await SearchAsync(keyword, null, null, null, null, null, null, null, null, null, null, null, null, "created", "desc", page, pageSize);
        }

        public async Task<(List<User> Users, int TotalCount)> SearchAsync(
            string? keyword,
            string? email,
            string? username,
            string? firstName,
            string? lastName,
            string? phone,
            string? company,
            string? ipAddress,
            string? zipPostalCode,
            bool? isActive,
            int[] userTypes,
            DateTime? registrationFrom,
            DateTime? registrationTo,
            string sortField,
            string sortDir,
            int page,
            int pageSize)
        {
            // Tích lũy các filter trên IQueryable để database xử lý trước khi phân trang.
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(email))
            {
                var normalizedEmail = email.Trim().ToLower();
                query = query.Where(u => u.Email.ToLower().Contains(normalizedEmail));
            }

            if (!string.IsNullOrEmpty(username))
            {
                var normalizedUsername = username.Trim().ToLower();
                query = query.Where(u => u.UserName.ToLower().Contains(normalizedUsername));
            }

            if (!string.IsNullOrEmpty(firstName))
            {
                var normalizedFirstName = firstName.Trim().ToLower();
                query = query.Where(u => u.FirstName != null && u.FirstName.ToLower().Contains(normalizedFirstName));
            }

            if (!string.IsNullOrEmpty(lastName))
            {
                var normalizedLastName = lastName.Trim().ToLower();
                query = query.Where(u => u.LastName != null && u.LastName.ToLower().Contains(normalizedLastName));
            }

            if (!string.IsNullOrEmpty(phone))
            {
                var normalizedPhone = phone.Trim().ToLower();
                query = query.Where(u => u.Phone != null && u.Phone.ToLower().Contains(normalizedPhone));
            }

            if (!string.IsNullOrEmpty(company))
            {
                var normalizedCompany = company.Trim().ToLower();
                query = query.Where(u => u.Company != null && u.Company.ToLower().Contains(normalizedCompany));
            }

            if (!string.IsNullOrEmpty(ipAddress))
            {
                var normalizedIpAddress = ipAddress.Trim().ToLower();
                query = query.Where(u => u.IpAddress != null && u.IpAddress.ToLower().Contains(normalizedIpAddress));
            }

            if (!string.IsNullOrEmpty(zipPostalCode))
            {
                var normalizedZip = zipPostalCode.Trim().ToLower();
                query = query.Where(u => u.ZipPostalCode != null && u.ZipPostalCode.ToLower().Contains(normalizedZip));
            }

            if (isActive.HasValue)
            {
                var statusStr = isActive.Value ? "active" : "banned";
                query = query.Where(u => u.Status == statusStr);
            }

            if (userTypes != null && userTypes.Length > 0)
            {
                var roleStrings = userTypes.Select(type => type == 1 ? "admin" : type == 2 ? "staff" : "customer").ToList();
                query = query.Where(u => roleStrings.Contains(u.Role));
            }

            if (registrationFrom.HasValue)
            {
                query = query.Where(u => u.Created >= registrationFrom.Value.Date);
            }

            if (registrationTo.HasValue)
            {
                var endDate = registrationTo.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(u => u.Created <= endDate);
            }

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(u =>
                    u.UserName.ToLower().Contains(keyword) ||
                    u.Name.ToLower().Contains(keyword) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(keyword)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(keyword)) ||
                    (u.Email != null && u.Email.ToLower().Contains(keyword)));
            }

            var totalCount = await query.CountAsync();

            bool isAsc = string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

            query = sortField?.ToLower() switch
            {
                "name" => isAsc ? query.OrderBy(u => u.Name) : query.OrderByDescending(u => u.Name),
                "email" => isAsc ? query.OrderBy(u => u.Email) : query.OrderByDescending(u => u.Email),
                "role" => isAsc ? query.OrderBy(u => u.Role) : query.OrderByDescending(u => u.Role),
                "created" => isAsc ? query.OrderBy(u => u.Created) : query.OrderByDescending(u => u.Created),
                _ => query.OrderByDescending(u => u.Created)
            };

            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }
    }
}
