using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;
using BaseCore.Entities;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace BaseCore.LogService
{
    public interface ILogErrorService
    {
        Task<ICollection<LogError>> GetAllListAsync();
        Task CreateLog(HttpContext httpContext, string message);
    }

    public class LogErrorService : ILogErrorService
    {
        private readonly SQLServerDbContext _context;
        public LogErrorService(SQLServerDbContext dbContext)
        {
            _context = dbContext;
        }

        public async Task CreateLog(HttpContext httpContext, string message)
        {
            var requestBody = string.Empty;
            httpContext.Request.EnableBuffering();
            using (var reader = new StreamReader(httpContext.Request.Body))
            {
                requestBody = reader.ReadToEnd();
                httpContext.Request.Body.Seek(0, SeekOrigin.Begin);
                requestBody = reader.ReadToEnd();
            }

            var pathUrl = string.Format("{0}://{1}{2}", httpContext.Request.Scheme, httpContext.Request.Host, httpContext.Request.Path);
            var logError = new LogError
            {
                Header = $"REQUEST HttpMethod: {httpContext.Request.Method}, Path: {pathUrl}, Content-Type: {httpContext.Request.ContentType}",
                Body = requestBody,
                CreatedUser = httpContext.User.Identity.Name, 
                Message = message
            };

            _context.LogErrors.Add(logError);
            await _context.SaveChangesAsync();
        }

        public async Task<ICollection<LogError>> GetAllListAsync()
        {
            return await _context.LogErrors.ToListAsync();
        }
    }
}
