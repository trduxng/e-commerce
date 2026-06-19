Để viết thêm một Module mới cho dự án **BaseCore**, bạn cần triển khai theo quy trình đi từ **Database -> Backend -> Gateway -> Frontend**.

Dưới đây là **7 bước cụ thể kèm code mẫu** (ví dụ viết module **Quản lý Hãng vận chuyển - Shipments**):

---

## 🏗️ BƯỚC 1: Định nghĩa Thực thể dữ liệu (Backend - `BaseCore.Entities`)

Tạo class Entity đại diện cho bảng dữ liệu trong Database.

- **Hành động:** Tạo file `Shipment.cs` trong project `BaseCore.Entities`.
- **Code mẫu:**
  ```csharp
  namespace BaseCore.Entities
  {
      public class Shipment
      {
          public int Id { get; set; }
          public string ProviderName { get; set; }
          public string Phone { get; set; }
          public decimal BasePrice { get; set; }
          public bool IsActive { get; set; }
          public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
      }
  }
  ```

---

## 🗄️ BƯỚC 2: Cấu hình DB & Tạo Migration (Backend - `BaseCore.Repository`)

1.  **Đăng ký DbSet và Map Fluent API:** Mở `SQLServerDbContext.cs`, thêm dòng đăng ký:
    ```csharp
    public DbSet<Shipment> Shipments { get; set; }
    ```
    Và thêm cấu hình map bảng vào phương thức `OnModelCreating`:
    ```csharp
    modelBuilder.Entity<Shipment>(entity =>
    {
        entity.ToTable("shipments", "sales"); // Đặt vào schema sales
        entity.HasKey(e => e.Id);
        entity.Property(e => e.ProviderName).HasMaxLength(100).IsRequired();
        entity.Property(e => e.BasePrice).HasPrecision(15, 2);
    });
    ```
2.  **Chạy lệnh Migration để cập nhật SQL Server:** Mở CMD/PowerShell tại thư mục gốc dự án và chạy:

    ```bash
    # 1. Tạo file ghi nhận thay đổi Database
    dotnet ef migrations add AddShipmentModule --project BaseCore.Repository --startup-project BaseCore.APIService

    # 2. Cập nhật trực tiếp xuống SQL Server
    dotnet ef database update --project BaseCore.Repository --startup-project BaseCore.APIService
    ```

---

## 🔄 BƯỚC 3: Viết Repository truy vấn dữ liệu (Backend - `BaseCore.Repository`)

1.  **Định nghĩa Interface** `IShipmentRepository.cs`:
    ```csharp
    public interface IShipmentRepository
    {
        Task<IEnumerable<Shipment>> GetAllAsync();
        Task<Shipment> GetByIdAsync(int id);
        Task CreateAsync(Shipment shipment);
        Task UpdateAsync(Shipment shipment);
        Task DeleteAsync(int id);
    }
    ```
2.  **Triển khai class** `ShipmentRepository.cs`:

    ```csharp
    public class ShipmentRepository : IShipmentRepository
    {
        private readonly SQLServerDbContext _context;
        public ShipmentRepository(SQLServerDbContext context) => _context = context;

        public async Task<IEnumerable<Shipment>> GetAllAsync() => await _context.Shipments.ToListAsync();
        public async Task<Shipment> GetByIdAsync(int id) => await _context.Shipments.FindAsync(id);
        public async Task CreateAsync(Shipment shipment) { _context.Shipments.Add(shipment); await _context.SaveChangesAsync(); }
        public async Task UpdateAsync(Shipment shipment) { _context.Shipments.Update(shipment); await _context.SaveChangesAsync(); }
        public async Task DeleteAsync(int id) { var item = await GetByIdAsync(id); if(item != null) { _context.Shipments.Remove(item); await _context.SaveChangesAsync(); } }
    }
    ```

3.  **Đăng ký DI (Dependency Injection):** Mở `Program.cs` của `BaseCore.APIService` đăng ký:
    ```csharp
    builder.Services.AddScoped<IShipmentRepository, ShipmentRepository>();
    ```

---

## 🔌 BƯỚC 4: Tạo API Controller (Backend - `BaseCore.APIService`)

Tạo class Endpoint để Frontend gọi lấy dữ liệu.

- **Hành động:** Tạo file `ShipmentsController.cs` tại thư mục `Controllers` của `BaseCore.APIService`.
- **Code mẫu:**

  ```csharp
  [ApiController]
  [Route("api/[controller]")]
  public class ShipmentsController : ControllerBase
  {
      private readonly IShipmentRepository _repo;
      public ShipmentsController(IShipmentRepository repo) => _repo = repo;

      [HttpGet]
      public async Task<IActionResult> Get() => Ok(await _repo.GetAllAsync());

      [HttpPost]
      public async Task<IActionResult> Create([FromBody] Shipment shipment)
      {
          await _repo.CreateAsync(shipment);
          return Ok(shipment);
      }

      [HttpDelete("{id}")]
      public async Task<IActionResult> Delete(int id) { await _repo.DeleteAsync(id); return Ok(); }
  }
  ```

---

## 🔀 BƯỚC 5: Cấu hình Định tuyến Gateway (Backend - `BaseCore.ApiGateway`)

- **Hành động:** Mở `ocelot.json`, thêm cấu hình Route chuyển tiếp request từ Client đến `APIService`:
  ```json
  {
    "DownstreamPathTemplate": "/api/shipments/{everything}",
    "DownstreamScheme": "http",
    "DownstreamHostAndPorts": [
      { "Host": "localhost", "Port": 5001 }
    ],
    "UpstreamPathTemplate": "/api/shipments/{everything}",
    "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ]
  },
  {
    "DownstreamPathTemplate": "/api/shipments",
    "DownstreamScheme": "http",
    "DownstreamHostAndPorts": [
      { "Host": "localhost", "Port": 5001 }
    ],
    "UpstreamPathTemplate": "/api/shipments",
    "UpstreamHttpMethod": [ "GET", "POST", "OPTIONS" ]
  }
  ```

---

## 🌐 BƯỚC 6: Tạo API Call ở Frontend (Frontend - `BaseCore.WebClient`)

- **Hành động:** Mở `src/services/api.js` cấu hình axios gọi API:
  ```javascript
  export const shipmentApi = {
    getAll: () => api.get("/shipments"),
    create: (data) => api.post("/shipments", data),
    delete: (id) => api.delete(`/shipments/${id}`),
  };
  ```

---

## 🖥️ BƯỚC 7: Xây dựng Giao diện màn hình Admin (Frontend - `BaseCore.WebClient`)

1.  **Tạo trang UI:** Tạo file `src/pages/Shipments.jsx` sử dụng Bootstrap 5 để hiển thị danh sách và Form thêm mới:

    ```javascript
    import React, { useEffect, useState } from "react";
    import { shipmentApi } from "../services/api";

    export default function Shipments() {
      const [shipments, setShipments] = useState([]);

      useEffect(() => {
        shipmentApi.getAll().then((res) => setShipments(res.data));
      }, []);

      return (
        <div className="container mt-4">
          <h2>Quản lý hãng vận chuyển</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Tên hãng</th>
                <th>Giá sàn</th>
                <th>Hoạt động</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td>{s.providerName}</td>
                  <td>{s.basePrice}</td>
                  <td>{s.isActive ? "Bật" : "Tắt"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    ```

2.  **Đăng ký Route:** Mở `src/App.jsx` và import trang mới, đăng ký thẻ `<Route path="/admin/shipments" element={<Shipments />} />` vào danh sách Route của Admin.

---

## 🎯 CÁCH TRẢ LỜI NGẮN GỌN KHI THI VẤN ĐÁP:

> _"Thưa thầy cô, để viết một module mới, quy trình của em gồm 3 phần chính:_
>
> 1.  **Database & Entity:** Tạo class Entity trong dự án Entities, cấu hình DbContext để Map bảng bằng Fluent API, sau đó dùng lệnh Package Manager Console chạy Migration để sinh bảng trên SQL Server.
> 2.  **Backend Services:** Viết Interface và Repository để xử lý CRUD dữ liệu, đăng ký Dependency Injection, và tạo API Controller tại APIService để lộ cổng gọi dữ liệu. Cuối cùng, em thêm cấu hình Upstream/Downstream trong `ocelot.json` của ApiGateway để định tuyến.
> 3.  **Frontend:** Thêm các hàm Axios gọi endpoint mới trong file `api.js`, tạo màn hình UI React, và cấu hình định tuyến Route trong file `App.jsx` để hiển thị lên trang Admin."\*
