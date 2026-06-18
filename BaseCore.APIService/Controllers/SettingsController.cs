using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly string _settingsFilePath;

        public SettingsController(IWebHostEnvironment env)
        {
            _settingsFilePath = Path.Combine(env.ContentRootPath, "settings.json");
        }

        [HttpGet]
        public IActionResult GetSettings()
        {
            // Cấu hình cửa hàng lưu bằng JSON; thiếu/hỏng file thì trả về giá trị mặc định.
            if (!System.IO.File.Exists(_settingsFilePath))
            {
                return Ok(new StoreSettingsDto());
            }

            try
            {
                var json = System.IO.File.ReadAllText(_settingsFilePath);
                var settings = JsonSerializer.Deserialize<StoreSettingsDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(settings ?? new StoreSettingsDto());
            }
            catch
            {
                return Ok(new StoreSettingsDto());
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager,manager")]
        public IActionResult UpdateSettings([FromBody] StoreSettingsDto settings)
        {
            // Ghi đè toàn bộ file vì frontend luôn gửi trạng thái cấu hình hoàn chỉnh.
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
            System.IO.File.WriteAllText(_settingsFilePath, json);
            return Ok(settings);
        }
    }

    public class StoreSettingsDto
    {
        public string StoreName { get; set; } = "BaseShop";
        public string LogoUrl { get; set; } = "";
        public string ContactEmail { get; set; } = "info@baseshop.com";
        public string ContactPhone { get; set; } = "+012 345 6789";
        public string Address { get; set; } = "123 Street, City, Country";
        public string FacebookLink { get; set; } = "#";
        public string TwitterLink { get; set; } = "#";
        public string InstagramLink { get; set; } = "#";
    }
}
