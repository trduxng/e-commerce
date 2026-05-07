using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Order Repository using Entity Framework Core
    /// </summary>
    public interface IOrderRepositoryEF : IRepository<Order>
    {
        Task<List<Order>> GetByUserAsync(long userId);
        Task<List<Order>> GetAllWithDetailsAsync();
        Task<(List<Order> Orders, int TotalCount, OrderSearchSummary Summary)> SearchAllWithDetailsAsync(string? keyword, string? status, int page, int pageSize);
        Task<(List<Order> Orders, int TotalCount, OrderSearchSummary Summary)> SearchAllWithDetailsAsync(string? keyword, string? status, DateTime? fromDate, DateTime? toDate, int page, int pageSize);
        Task<Order?> GetWithDetailsAsync(long orderId);
    }

    public class OrderSearchSummary
    {
        public int TotalOrders { get; set; }
        public int ValidOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public Dictionary<string, int> ByStatus { get; set; } = new();
    }

    public class OrderRepositoryEF : Repository<Order>, IOrderRepositoryEF
    {
        public OrderRepositoryEF(SQLServerDbContext context) : base(context)
        {
        }

        public async Task<List<Order>> GetByUserAsync(long userId)
        {
            return await _dbSet
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetAllWithDetailsAsync()
        {
            return await _dbSet
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<(List<Order> Orders, int TotalCount, OrderSearchSummary Summary)> SearchAllWithDetailsAsync(
            string? keyword,
            string? status,
            int page,
            int pageSize)
        {
            return await SearchAllWithDetailsAsync(keyword, status, null, null, page, pageSize);
        }

        public async Task<(List<Order> Orders, int TotalCount, OrderSearchSummary Summary)> SearchAllWithDetailsAsync(
            string? keyword,
            string? status,
            DateTime? fromDate,
            DateTime? toDate,
            int page,
            int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _dbSet
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                var endDate = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(o => o.CreatedAt <= endDate);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();
                query = query.Where(o => o.OrderStatus.ToLower() == normalizedStatus);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var normalizedKeyword = keyword.Trim().ToLower();
                query = query.Where(o =>
                    o.OrderCode.ToLower().Contains(normalizedKeyword) ||
                    o.ReceiverName.ToLower().Contains(normalizedKeyword) ||
                    o.ReceiverPhone.ToLower().Contains(normalizedKeyword) ||
                    o.PaymentMethod.ToLower().Contains(normalizedKeyword) ||
                    o.OrderStatus.ToLower().Contains(normalizedKeyword) ||
                    (o.GuestEmail != null && o.GuestEmail.ToLower().Contains(normalizedKeyword)) ||
                    (o.ShippingAddressFull != null && o.ShippingAddressFull.ToLower().Contains(normalizedKeyword)) ||
                    o.OrderDetails.Any(od =>
                        od.ProductNameSnapshot.ToLower().Contains(normalizedKeyword) ||
                        od.SkuSnapshot.ToLower().Contains(normalizedKeyword)));
            }

            var totalCount = await query.CountAsync();
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var validOrdersQuery = query.Where(o => o.OrderStatus != "cancelled");
            var byStatus = await query
                .GroupBy(o => o.OrderStatus)
                .Select(group => new { Status = group.Key, Count = group.Count() })
                .ToDictionaryAsync(item => item.Status, item => item.Count);

            var summary = new OrderSearchSummary
            {
                TotalOrders = totalCount,
                ValidOrders = await validOrdersQuery.CountAsync(),
                TotalRevenue = await validOrdersQuery.SumAsync(o => (decimal?)o.TotalAmount) ?? 0,
                TodayRevenue = await validOrdersQuery
                    .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0,
                ByStatus = byStatus
            };

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (orders, totalCount, summary);
        }

        public async Task<Order?> GetWithDetailsAsync(long orderId)
        {
            return await _dbSet
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }
    }

    /// <summary>
    /// OrderDetail Repository using Entity Framework Core
    /// </summary>
    public interface IOrderDetailRepositoryEF : IRepository<OrderDetail>
    {
        Task<List<OrderDetail>> GetByOrderAsync(long orderId);
    }

    public class OrderDetailRepositoryEF : Repository<OrderDetail>, IOrderDetailRepositoryEF
    {
        public OrderDetailRepositoryEF(SQLServerDbContext context) : base(context)
        {
        }

        public async Task<List<OrderDetail>> GetByOrderAsync(long orderId)
        {
            return await _dbSet
                .Where(od => od.OrderId == orderId)
                .Include(od => od.ProductVariant)
                .ThenInclude(pv => pv.Product)
                .ToListAsync();
        }
    }
}
