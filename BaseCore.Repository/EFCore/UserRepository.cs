using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// User Repository using Entity Framework Core
    /// </summary>
    public interface IUserRepositoryEF : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<(List<User> Users, int TotalCount)> SearchAsync(string? keyword, int page, int pageSize);
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
            int page,
            int pageSize);
    }

    public class UserRepositoryEF : Repository<User>, IUserRepositoryEF
    {
        public UserRepositoryEF(SQLServerDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == username && u.Status == "active" && u.DeletedAt == null);
        }

        public async Task<(List<User> Users, int TotalCount)> SearchAsync(string? keyword, int page, int pageSize)
        {
            return await SearchAsync(keyword, null, null, null, null, null, null, null, null, null, null, null, null, page, pageSize);
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
            int page,
            int pageSize)
        {
            var query = _dbSet.AsQueryable();

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

            var users = await query
                .OrderByDescending(u => u.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }
    }
}
