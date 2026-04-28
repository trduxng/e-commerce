using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;
using BaseCore.Entities;

namespace BaseCore.LogService
{
    public interface ILogActionService
    {
        Task<ICollection<LogAction>> GetAllListAsync();

        Task CreateLog(LogAction logAction);
    }

    public class LogActionService : ILogActionService
    {
        private readonly SQLServerDbContext _context;
        public LogActionService(SQLServerDbContext dbContext)
        {
            _context = dbContext;
        }

        public async Task<ICollection<LogAction>> GetAllListAsync()
        {
            return await _context.LogActions.ToListAsync();
        }

        public async Task CreateLog(LogAction logAction)
        {
            _context.LogActions.Add(logAction);
            await _context.SaveChangesAsync();
        }
    }
}
