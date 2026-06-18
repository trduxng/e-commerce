using BaseCore.Entities;
using BaseCore.Repository;
using Bogus;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace BaseCore.APIService.Services
{
    public interface IDatabaseSeeder
    {
        Task<SeedResult> SeedAllAsync(int userCount = 100, int categoryCount = 20, int productCount = 300, int orderCount = 200);
        Task<bool> ClearAllDataAsync();
    }

    public class SeedResult
    {
        public int UsersCreated { get; set; }
        public int CategoriesCreated { get; set; }
        public int ProductsCreated { get; set; }
        public int OrdersCreated { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class DatabaseSeeder : IDatabaseSeeder
    {
        private readonly SQLServerDbContext _db;

        public DatabaseSeeder(SQLServerDbContext db)
        {
            _db = db;
        }

        public async Task<bool> ClearAllDataAsync()
        {
            try {
                // DEVELOPMENT ONLY: tạm tắt constraint và xóa dữ liệu theo thứ tự bảng phụ thuộc.
                var sql = @"
                    EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
                    DELETE FROM [orders].[bill_details];
                    DELETE FROM [orders].[bills];
                    DELETE FROM [orders].[cart_items];
                    DELETE FROM [orders].[carts];
                    DELETE FROM [catalog].[product_variants];
                    DELETE FROM [catalog].[products];
                    DELETE FROM [catalog].[product_types];
                    DELETE FROM [auth].[users] WHERE email NOT IN ('admin@basecore.local', 'customer@basecore.local');
                    EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL';
                ";
                await _db.Database.ExecuteSqlRawAsync(sql);
                return true;
            } catch (Exception ex) {
                Console.WriteLine("Clear error: " + ex.Message);
                return false;
            }
        }


        public async Task<SeedResult> SeedAllAsync(int userCount = 100, int categoryCount = 10, int productCount = 100, int orderCount = 50)
        {
            var result = new SeedResult();
            var now = DateTime.Now;

            // Seeder luôn bắt đầu từ dữ liệu sạch, vì vậy không được chạy trên database production.
            await ClearAllDataAsync();

            // 1. Seed Users (Việt hóa)
            var userFaker = new Faker<User>("vi")
                .RuleFor(u => u.Email, f => f.Internet.Email())
                .RuleFor(u => u.Password, f => "password123")
                .RuleFor(u => u.Name, f => f.Name.FullName())
                .RuleFor(u => u.Phone, f => f.Phone.PhoneNumber("09########"))
                .RuleFor(u => u.Role, f => f.PickRandom("customer", "customer", "admin"))
                .RuleFor(u => u.Status, f => "active")
                .RuleFor(u => u.Image, f => f.Image.PicsumUrl())
                .RuleFor(u => u.EmailVerifiedAt, f => now)
                .RuleFor(u => u.Created, f => now)
                .RuleFor(u => u.UpdatedAt, f => now);

            var users = userFaker.Generate(userCount);
            _db.Users.AddRange(users);
            result.UsersCreated = users.Count;

            // 2. Seed Categories (Chuẩn Việt)
            var categoryDefinitions = new[] { 
                (Name: "Điện thoại & Máy tính", Keyword: "tech,laptop,phone"), 
                (Name: "Thời trang nam", Keyword: "men,shirt,jeans"), 
                (Name: "Thời trang nữ", Keyword: "women,dress,fashion"), 
                (Name: "Đồ gia dụng", Keyword: "home,kitchen"), 
                (Name: "Phụ kiện công nghệ", Keyword: "gadget,audio")
            };
            
            var categories = new List<Category>();
            for (int i = 0; i < categoryDefinitions.Length; i++)
            {
                var def = categoryDefinitions[i];
                categories.Add(new Category {
                    Name = def.Name,
                    Slug = Slugify(def.Name),
                    Description = $"Sản phẩm {def.Name} chính hãng, cam kết chất lượng tốt nhất thị trường.",
                    ImageUrl = $"https://loremflickr.com/400/300/{def.Keyword.Split(',')[0]}",
                    IsActive = true,
                    SortOrder = i + 1
                });
            }
            _db.Categories.AddRange(categories);
            result.CategoriesCreated = categories.Count;
            await _db.SaveChangesAsync();

            // 3. Seed Products (Mô tả & Ảnh khớp 100%)
            var products = new List<Product>();
            var productData = new Dictionary<string, (string Name, string Desc, string Key, decimal Price)[]> {
                ["Điện thoại & Máy tính"] = new[] { 
                    ("iPhone 15 Pro Max 512GB", "Chip A17 Pro mạnh mẽ, camera zoom 5x, khung Titanium siêu nhẹ.", "iphone,15", 34990000m),
                    ("MacBook Air M3 2024", "Siêu mỏng nhẹ, hiệu năng cực đỉnh với chip M3, pin dùng cả ngày.", "macbook", 27990000m),
                    ("Samsung Galaxy S24 Ultra", "Camera 200MP, bút S-Pen tích hợp, tính năng AI dịch thuật trực tiếp.", "samsung,s24", 29990000m)
                },
                ["Thời trang nam"] = new[] { 
                    ("Áo sơ mi Oxford trắng", "Chất liệu vải Oxford cao cấp, thoáng mát, form dáng Slim-fit hiện đại.", "shirt,men", 450000m),
                    ("Quần Jean Denim xanh đậm", "Vải jean co giãn 4 chiều, giữ form tốt, không phai màu khi giặt.", "jeans,men", 650000m)
                },
                ["Đồ gia dụng"] = new[] { 
                    ("Nồi chiên không dầu Philips", "Dung tích 6.2L, công nghệ Rapid Air giảm 90% dầu mỡ, màn hình cảm ứng.", "airfryer", 3200000m),
                    ("Máy hút bụi cầm tay Dyson", "Lực hút mạnh mẽ, không dây tiện lợi, màng lọc HEPA diệt khuẩn 99%.", "vacuum", 15000000m)
                },
                ["Phụ kiện công nghệ"] = new[] { 
                    ("Tai nghe AirPods Pro 2", "Chống ồn chủ động, âm thanh không gian, cổng sạc USB-C mới nhất.", "airpods", 5990000m),
                    ("Loa Bluetooth Marshall Acton", "Âm thanh cực chất, thiết kế retro sang trọng, phù hợp trang trí decor.", "marshall", 6800000m)
                }
            };

            foreach (var cat in categories)
            {
                if (productData.TryGetValue(cat.Name, out var pItems))
                {
                    foreach (var item in pItems)
                    {
                        var product = new Product {
                            CategoryId = cat.Id,
                            Name = item.Name,
                            Slug = Slugify(item.Name) + "-" + new Random().Next(1000, 9999),
                            Price = item.Price,
                            Description = item.Desc,
                            IsActive = true,
                            CreatedAt = now,
                            UpdatedAt = now,
                            ImageUrl = $"https://loremflickr.com/640/480/{item.Key.Split(',')[0]},product/any?lock={new Random().Next(1, 1000)}"
                        };
                        product.Stock = new Random().Next(20, 100);
                        products.Add(product);
                    }
                }
            }
            _db.Products.AddRange(products);
            result.ProductsCreated = products.Count;
            await _db.SaveChangesAsync();

            // 4. Seed Orders (Đơn hàng thật)
            var orders = new Faker<Order>("vi")
                .RuleFor(o => o.UserId, f => f.PickRandom(users).Id)
                .RuleFor(o => o.OrderCode, f => "ORD-" + f.Random.Replace("######").ToUpper())
                .RuleFor(o => o.OrderStatus, f => "delivered")
                .RuleFor(o => o.PaymentStatus, f => "paid")
                .RuleFor(o => o.ReceiverName, f => f.Name.FullName())
                .RuleFor(o => o.ReceiverPhone, f => f.Phone.PhoneNumber("0#########"))
                .RuleFor(o => o.ShippingAddressFull, f => f.Address.FullAddress())
                .RuleFor(o => o.TotalAmount, 0)
                .RuleFor(o => o.CreatedAt, f => f.Date.Past(1))
                .RuleFor(o => o.UpdatedAt, (f, o) => o.CreatedAt)
                .Generate(orderCount);

            _db.Orders.AddRange(orders);
            await _db.SaveChangesAsync();

            // 5. Link Order Details
            foreach (var order in orders)
            {
                var prod = products[new Random().Next(products.Count)];
                var variant = _db.ProductVariants.FirstOrDefault(pv => pv.ProductId == prod.Id);
                if (variant == null) continue;

                var detail = new OrderDetail {
                    OrderId = order.Id,
                    ProductVariantId = variant.Id,
                    Quantity = 1,
                    UnitPrice = prod.Price,
                    TotalPrice = prod.Price,
                    ProductNameSnapshot = prod.Name,
                    SkuSnapshot = variant.Sku ?? "SKU-FIXED"
                };
                _db.OrderDetails.Add(detail);
                order.TotalAmount = detail.TotalPrice;
            }

            await _db.SaveChangesAsync();
            result.OrdersCreated = orders.Count;
            result.Message = "Hệ thống đã được dọn sạch rác và nạp dữ liệu chuẩn 100% Việt Nam.";
            return result;
        }

        private string Slugify(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            text = text.ToLowerInvariant();
            text = Regex.Replace(text, @"[áàảãạăắằẳẵặâấầẩẫậ]", "a");
            text = Regex.Replace(text, @"[éèẻẽẹêếềểễệ]", "e");
            text = Regex.Replace(text, @"[íìỉĩị]", "i");
            text = Regex.Replace(text, @"[óòỏõọôốồổỗộơớờởỡợ]", "o");
            text = Regex.Replace(text, @"[úùủũụưứừửữự]", "u");
            text = Regex.Replace(text, @"[ýỳỷỹỵ]", "y");
            text = Regex.Replace(text, @"[đ]", "d");
            text = Regex.Replace(text, @"\s+", "-");
            text = Regex.Replace(text, @"[^a-z0-9-]", "");
            text = Regex.Replace(text, @"-+", "-");
            return text.Trim('-');
        }
    }
}
