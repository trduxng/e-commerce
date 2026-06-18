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
                    DELETE FROM [catalog].[product_reviews];
                    DELETE FROM [catalog].[products];
                    DELETE FROM [catalog].[manufacturers];
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

            // 1.5 Seed Manufacturers
            var manufacturerNames = new[] { "Apple", "Samsung", "Sony", "Dell", "ASUS", "Nike", "Adidas", "Philips", "Dyson", "DeLonghi" };
            var manufacturers = new List<Manufacturer>();
            for (int i = 0; i < manufacturerNames.Length; i++)
            {
                manufacturers.Add(new Manufacturer {
                    Name = manufacturerNames[i],
                    Description = $"Hãng {manufacturerNames[i]} nổi tiếng toàn cầu",
                    PictureUrl = $"https://loremflickr.com/300/300/logo,{manufacturerNames[i]}",
                    IsActive = true,
                    SortOrder = i + 1,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            _db.Manufacturers.AddRange(manufacturers);
            await _db.SaveChangesAsync();

            // 2. Seed Categories (Chuẩn Việt)
            var categoryDefinitions = new[] { 
                (Name: "Điện thoại & Máy tính", ImageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=600"), 
                (Name: "Thời trang & Giày dép", ImageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600"), 
                (Name: "Đồ dùng nhà bếp", ImageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600"), 
                (Name: "Thiết bị âm thanh", ImageUrl: "https://images.unsplash.com/photo-1484755560693-a4074577af3a?q=80&w=600"), 
                (Name: "Mỹ phẩm & Chăm sóc cá nhân", ImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600"),
                (Name: "Nội thất & Trang trí nhà cửa", ImageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600"),
                (Name: "Sách & Văn phòng phẩm", ImageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600"),
                (Name: "Thực phẩm & Đồ uống", ImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600")
            };
            
            var categories = new List<Category>();
            for (int i = 0; i < categoryDefinitions.Length; i++)
            {
                var def = categoryDefinitions[i];
                categories.Add(new Category {
                    Name = def.Name,
                    Slug = Slugify(def.Name),
                    Description = $"Sản phẩm {def.Name} chính hãng, cam kết chất lượng tốt nhất thị trường.",
                    ImageUrl = def.ImageUrl,
                    IsActive = true,
                    SortOrder = i + 1
                });
            }
            _db.Categories.AddRange(categories);
            result.CategoriesCreated = categories.Count;
            await _db.SaveChangesAsync();

            // 3. Seed Products (Mô tả & Ảnh khớp 100% tiếng Việt)
            var baseProducts = new[] {
                new {
                    CategoryName = "Điện thoại & Máy tính",
                    Name = "iPhone 15 Pro Max 256GB Titanium",
                    Desc = "Thiết kế titan bền bỉ, màn hình Super Retina XDR với ProMotion, chip A17 Pro siêu mạnh mẽ, hệ thống camera chuyên nghiệp 48MP.",
                    Price = 29990000m,
                    PhotoId = "1695048133142-1a20484d2569",
                    EngKeyword = "iphone,phone"
                },
                new {
                    CategoryName = "Điện thoại & Máy tính",
                    Name = "Laptop Gaming ASUS ROG Strix G16",
                    Desc = "Cấu hình cực khủng với CPU Intel Core i9 Gen 13, GPU RTX 4060, màn hình 16 inch 165Hz chuyên game.",
                    Price = 34500000m,
                    PhotoId = "1603302576837-37561b2e2302",
                    EngKeyword = "laptop,gaming"
                },
                new {
                    CategoryName = "Điện thoại & Máy tính",
                    Name = "MacBook Pro 14 M3 Space Grey",
                    Desc = "Hiệu năng vượt trội với chip Apple M3, màn hình Liquid Retina XDR 14 inch sắc nét, thời lượng pin lên tới 22 giờ liên tục.",
                    Price = 39990000m,
                    PhotoId = "1517336714731-489689fd1ca8",
                    EngKeyword = "macbook"
                },
                new {
                    CategoryName = "Điện thoại & Máy tính",
                    Name = "Samsung Galaxy S24 Ultra 5G 256GB",
                    Desc = "Đỉnh cao công nghệ AI Phone, camera 200MP siêu zoom 100x, bút S Pen đa năng, khung viền Titanium sang trọng.",
                    Price = 26990000m,
                    PhotoId = "1610945265064-0e34e5519bbf",
                    EngKeyword = "samsung,phone"
                },
                new {
                    CategoryName = "Điện thoại & Máy tính",
                    Name = "Máy Tính Bảng iPad Air 6 M2 11 inch Wifi",
                    Desc = "Thiết kế siêu mỏng nhẹ thời thượng, sức mạnh từ chip Apple M2 vượt trội, tương thích Apple Pencil Pro hỗ trợ vẽ sáng tạo.",
                    Price = 16990000m,
                    PhotoId = "1544244015-0df4b3ffc6b0",
                    EngKeyword = "ipad,tablet"
                },
                new {
                    CategoryName = "Thời trang & Giày dép",
                    Name = "Giày Thể Thao Nike Air Force 1 All White",
                    Desc = "Mẫu giày quốc dân thời trang, chất liệu da cao cấp dễ phối đồ, đế đệm Air êm ái cho ngày dài năng động.",
                    Price = 2950000m,
                    PhotoId = "1595950653106-6c9ebd614d3a",
                    EngKeyword = "sneakers,nike"
                },
                new {
                    CategoryName = "Thời trang & Giày dép",
                    Name = "Áo Khoác Gió Nam Thể Thao Chống Nước",
                    Desc = "Chất liệu vải dù cao cấp chống gió nước cực tốt, thiết kế thể thao hiện đại, thoáng khí và có túi khoá kéo tiện lợi.",
                    Price = 450000m,
                    PhotoId = "1551028719-00167b16eac5",
                    EngKeyword = "jacket,windbreaker"
                },
                new {
                    CategoryName = "Thời trang & Giày dép",
                    Name = "Quần Jeans Denim Slim Fit Nam",
                    Desc = "Vải denim co giãn nhẹ thoải mái, form dáng ôm tôn dáng, màu xanh chàm bền bỉ không ra màu khi giặt.",
                    Price = 580000m,
                    PhotoId = "1542272604-787c3835535d",
                    EngKeyword = "jeans,denim"
                },
                new {
                    CategoryName = "Thời trang & Giày dép",
                    Name = "Balo Du Lịch Phượt Chống Nước Oxford",
                    Desc = "Dung tích lớn nhiều ngăn tiện dụng, chất liệu vải Oxford chống thấm nước và chống mài mòn, quai đeo đệm khí êm ái.",
                    Price = 750000m,
                    PhotoId = "1553062407-98eeb64c6a62",
                    EngKeyword = "backpack"
                },
                new {
                    CategoryName = "Thời trang & Giày dép",
                    Name = "Mũ Lưỡi Trai Unisex Canvas Thêu Chữ Nổi",
                    Desc = "Mũ lưỡi trai phong cách trẻ trung, chất liệu canvas bền đẹp, thấm hút mồ hôi tốt.",
                    Price = 150000m,
                    PhotoId = "https://loremflickr.com/600/600/hat",
                    EngKeyword = "cap,hat"
                },
                new {
                    CategoryName = "Đồ dùng nhà bếp",
                    Name = "Nồi Chiên Không Dầu Philips HD9270 6.2L",
                    Desc = "Công nghệ Rapid Air giảm 90% dầu mỡ, dung tích lớn phù hợp cho gia đình 4-6 người, bảng điều khiển cảm ứng thông minh.",
                    Price = 2790000m,
                    PhotoId = "1621972750749-0fbb1abb7736",
                    EngKeyword = "airfryer"
                },
                new {
                    CategoryName = "Đồ dùng nhà bếp",
                    Name = "Máy Hút Bụi Cầm Tay Không Dây Dyson V15",
                    Desc = "Lực hút siêu mạnh 230AW, cảm biến bụi bẩn tự động điều chỉnh lực hút, màn hình LCD hiển thị thời gian thực.",
                    Price = 16990000m,
                    PhotoId = "1558317374-067fb5f30001",
                    EngKeyword = "vacuum"
                },
                new {
                    CategoryName = "Đồ dùng nhà bếp",
                    Name = "Máy Pha Cà Phê Espresso DeLonghi Dedica",
                    Desc = "Máy pha cà phê chuyên nghiệp thiết kế nhỏ gọn, pha espresso đậm đà.",
                    Price = 6490000m,
                    PhotoId = "https://loremflickr.com/600/600/coffeemachine",
                    EngKeyword = "espresso,coffee"
                },
                new {
                    CategoryName = "Đồ dùng nhà bếp",
                    Name = "Bình Giữ Nhiệt Lưỡng Tính Lock&Lock 500ml",
                    Desc = "Chất liệu inox 316 cao cấp an toàn sức khỏe, giữ nóng/lạnh lên đến 12 tiếng, thiết kế nắp lọc trà tiện dụng.",
                    Price = 320000m,
                    PhotoId = "1602143407151-7111542de6e8",
                    EngKeyword = "thermos,bottle"
                },
                new {
                    CategoryName = "Đồ dùng nhà bếp",
                    Name = "Ấm Siêu Tốc Thuỷ Tinh Thông Minh Tefal 1.7L",
                    Desc = "Ấm siêu tốc có tính năng đun sôi nhanh, hiển thị nhiệt độ thông minh.",
                    Price = 890000m,
                    PhotoId = "https://loremflickr.com/600/600/kettle",
                    EngKeyword = "kettle"
                },
                new {
                    CategoryName = "Thiết bị âm thanh",
                    Name = "Tai Nghe Chụp Tai Sony WH-1000XM5",
                    Desc = "Công nghệ chống ồn chủ động đỉnh cao nhất thị trường, chất âm Hi-Res Audio tinh tế, thời lượng pin ấn tượng lên tới 30 giờ.",
                    Price = 6990000m,
                    PhotoId = "1505740420928-5e560c06d30e",
                    EngKeyword = "headphones,sony"
                },
                new {
                    CategoryName = "Thiết bị âm thanh",
                    Name = "Loa Bluetooth Marshall Acton III retro",
                    Desc = "Loa Bluetooth phong cách cổ điển, âm thanh sống động trung thực.",
                    Price = 6200000m,
                    PhotoId = "https://loremflickr.com/600/600/speaker",
                    EngKeyword = "speaker,marshall"
                },
                new {
                    CategoryName = "Thiết bị âm thanh",
                    Name = "Tai Nghe Không Dây Apple AirPods Pro 2",
                    Desc = "Chống ồn chủ động mạnh gấp 2 lần bản cũ, âm thanh không gian cá nhân hóa, cổng sạc USB-C và hộp sạc tìm kiếm thông minh.",
                    Price = 5490000m,
                    PhotoId = "1600294037681-c80b4cb5b434",
                    EngKeyword = "airpods,earbuds"
                },
                new {
                    CategoryName = "Thiết bị âm thanh",
                    Name = "Loa Không Dây Sony SRS-XE200 Di Động",
                    Desc = "Loa di động chống nước IP67, khuếch đại âm thanh vòm.",
                    Price = 1950000m,
                    PhotoId = "https://loremflickr.com/600/600/speaker",
                    EngKeyword = "portablespeaker,sony"
                },
                new {
                    CategoryName = "Mỹ phẩm & Chăm sóc cá nhân",
                    Name = "Nước Hoa Chanel Bleu De Chanel EDP 100ml",
                    Desc = "Mùi hương nam tính mạnh mẽ quyến rũ, sự kết hợp giữa hương gỗ tuyết tùng và hương bưởi thanh mát, lưu hương lâu 8-12h.",
                    Price = 3650000m,
                    PhotoId = "1541643600914-78b084683601",
                    EngKeyword = "perfume,chanel"
                },
                new {
                    CategoryName = "Mỹ phẩm & Chăm sóc cá nhân",
                    Name = "Kem Chống Nắng La Roche-Posay Anthelios",
                    Desc = "Chỉ số chống nắng cực cao SPF 50+, kết cấu mỏng nhẹ không gây nhờn rít, kiểm soát bóng nhờn tối ưu cho da dầu mụn.",
                    Price = 420000m,
                    PhotoId = "1598440947619-2c35fc9aa908",
                    EngKeyword = "sunscreen,cream"
                },
                new {
                    CategoryName = "Mỹ phẩm & Chăm sóc cá nhân",
                    Name = "Son Môi Rouge Dior Velvet Màu 999 Đỏ",
                    Desc = "Tông màu đỏ cổ điển huyền thoại, chất son velvet lì mịn môi như nhung, thành phần dưỡng ẩm từ hoa tự nhiên giúp môi mềm mại.",
                    Price = 950000m,
                    PhotoId = "1586495777744-4413f21062fa",
                    EngKeyword = "lipstick,dior"
                },
                new {
                    CategoryName = "Mỹ phẩm & Chăm sóc cá nhân",
                    Name = "Sữa Rửa Mặt Tạo Bọt CeraVe Hydrating Cleanser",
                    Desc = "Giúp làm sạch bụi bẩn và dầu thừa dịu nhẹ, bổ sung 3 ceramides thiết yếu cùng hyaluronic acid duy trì độ ẩm tự nhiên cho da.",
                    Price = 370000m,
                    PhotoId = "1556228720-195a672e8a03",
                    EngKeyword = "cleanser,cerave"
                },
                new {
                    CategoryName = "Nội thất & Trang trí nhà cửa",
                    Name = "Ghế Sofa Băng Vải Nỉ Phòng Khách Minimalist",
                    Desc = "Ghế Sofa hiện đại bọc nỉ êm ái, phong cách Bắc Âu thanh lịch.",
                    Price = 4890000m,
                    PhotoId = "https://loremflickr.com/600/600/sofa",
                    EngKeyword = "sofa,couch"
                },
                new {
                    CategoryName = "Nội thất & Trang trí nhà cửa",
                    Name = "Đèn Bàn Học Sinh Làm Việc Chống Cận Xiaomi",
                    Desc = "Đèn bàn thông minh hỗ trợ chỉnh độ sáng linh hoạt, ánh sáng tự nhiên không nhấp nháy, bảo vệ mắt tối đa khi làm việc ban đêm.",
                    Price = 680000m,
                    PhotoId = "1507473885765-e6ed057f782c",
                    EngKeyword = "lamp,desk"
                },
                new {
                    CategoryName = "Nội thất & Trang trí nhà cửa",
                    Name = "Bàn Làm Việc Gỗ MDF Chân Sắt Sơn Tĩnh Điện",
                    Desc = "Bàn làm việc thông minh, gỗ MDF chống xước, chân sắt vững chắc.",
                    Price = 1250000m,
                    PhotoId = "https://loremflickr.com/600/600/desk",
                    EngKeyword = "desk,table"
                },
                new {
                    CategoryName = "Sách & Văn phòng phẩm",
                    Name = "Sách Đắc Nhân Tâm (Bìa Cứng Cao Cấp)",
                    Desc = "Cuốn sách nghệ thuật ứng xử nổi tiếng nhất mọi thời đại, giúp bạn giao tiếp thu phục lòng người và gặt hái thành công.",
                    Price = 120000m,
                    PhotoId = "1544947950-fa07a98d237f",
                    EngKeyword = "book"
                },
                new {
                    CategoryName = "Sách & Văn phòng phẩm",
                    Name = "Sổ Tay Ghi Chép Da PU Cao Cấp Ruột Dòng Kẻ",
                    Desc = "Chất liệu da PU siêu mềm mịn sang trọng, ruột giấy vàng chống loá dày dặn viết không nhòe mực, khổ A5 tiện dụng.",
                    Price = 85000m,
                    PhotoId = "1512820790803-83ca734da794",
                    EngKeyword = "notebook"
                },
                new {
                    CategoryName = "Sách & Văn phòng phẩm",
                    Name = "Hộp Bút Chì Màu Professional 72 Màu Deli",
                    Desc = "Bút chì màu gốc dầu mềm mịn chuyên nghiệp, tông màu chuẩn sắc nét dễ pha màu, hộp thiếc bảo quản chắc chắn sang trọng.",
                    Price = 350000m,
                    PhotoId = "1513364776144-60967b0f800f",
                    EngKeyword = "pencils,colors"
                },
                new {
                    CategoryName = "Thực phẩm & Đồ uống",
                    Name = "Cà Phê Hạt Rang Mộc Espresso Arabica Cầu Đất",
                    Desc = "100% hạt Arabica thượng hạng từ Cầu Đất Đà Lạt, rang mộc thơm nồng quyến rũ, vị chua thanh tinh tế hậu ngọt sâu.",
                    Price = 250000m,
                    PhotoId = "1514432324607-a09d9b4aefdd",
                    EngKeyword = "coffeebeans"
                },
                new {
                    CategoryName = "Thực phẩm & Đồ uống",
                    Name = "Trà Xanh Thái Nguyên Tân Cương Đặc Sản 500g",
                    Desc = "Được thu hái thủ công 1 tôm 2 lá truyền thống, nước trà xanh trong óng ánh, vị tiền chát ngọt hậu sâu đặc trưng.",
                    Price = 180000m,
                    PhotoId = "1576092768241-dec231879fc3",
                    EngKeyword = "tea"
                },
                new {
                    CategoryName = "Thực phẩm & Đồ uống",
                    Name = "Mật Ong Rừng U Minh Nguyên Chất Chai 500ml",
                    Desc = "Mật ong tự nhiên khai thác tại rừng tràm U Minh hoang dã, màu vàng hổ phách đặc quánh, hương thơm tự nhiên vị ngọt thanh mát.",
                    Price = 390000m,
                    PhotoId = "1587049352846-4a222e784d38",
                    EngKeyword = "honey"
                }
            };

            var products = new List<Product>();
            var colors = new[] { "Titan Tự Nhiên", "Xanh Dương", "Đen Huyền Bí", "Trắng Tinh Khôi", "Xám Space" };
            var specs = new[] { "128GB", "256GB", "512GB", "1TB", "Mặc định" };
            var sizes = new[] { "S", "M", "L", "XL", "Free Size" };

            for (int i = 0; i < productCount; i++)
            {
                var baseProd = baseProducts[i % baseProducts.Length];
                var cat = categories.FirstOrDefault(c => c.Name == baseProd.CategoryName);
                if (cat == null) continue;

                var suffix = "";
                if (i >= baseProducts.Length)
                {
                    var color = colors[(i / baseProducts.Length) % colors.Length];
                    if (baseProd.CategoryName == "Điện thoại & Máy tính" || baseProd.CategoryName == "Thiết bị âm thanh")
                    {
                        var spec = specs[(i / baseProducts.Length) % specs.Length];
                        suffix = $" - {color} ({spec})";
                    }
                    else if (baseProd.CategoryName == "Thời trang & Giày dép")
                    {
                        var size = sizes[(i / baseProducts.Length) % sizes.Length];
                        suffix = $" - Màu {color} (Size {size})";
                    }
                    else
                    {
                        suffix = $" - Màu {color}";
                    }
                }

                var name = baseProd.Name + suffix;
                var slug = Slugify(name) + "-" + new Random().Next(1000, 9999);
                
                // Sử dụng ảnh Unsplash tĩnh chất lượng cao từ plan hoặc loremflickr
                var imageUrl = baseProd.PhotoId.StartsWith("http") 
                    ? baseProd.PhotoId 
                    : $"https://images.unsplash.com/photo-{baseProd.PhotoId}?q=80&w=600&auto=format&fit=crop";

                var product = new Product {
                    CategoryId = cat.Id,
                    ManufacturerId = manufacturers[new Random().Next(manufacturers.Count)].Id,
                    Name = name,
                    Slug = slug,
                    BasePrice = baseProd.Price,
                    Description = baseProd.Desc + " Phiên bản chất lượng cao, thiết kế tỉ mỉ, độ bền lâu dài, bảo hành chính hãng toàn quốc.",
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                    ImageUrl = imageUrl,
                    Stock = new Random().Next(20, 100)
                };
                products.Add(product);
            }

            _db.Products.AddRange(products);
            result.ProductsCreated = products.Count;
            await _db.SaveChangesAsync();

            // Seed ProductVariants cụ thể để khớp với cấu trúc biến thể của sản phẩm
            var variants = new List<ProductVariant>();
            var genericColors = new[] { "Đen", "Trắng", "Xám", "Bạc", "Vàng" };
            var genericSizes = new[] { "S", "M", "L", "XL" };
            var techSpecs = new[] { "128GB", "256GB", "512GB" };
            var random = new Random();

            foreach (var prod in products)
            {
                var baseProd = baseProducts.FirstOrDefault(bp => prod.Name.StartsWith(bp.Name));
                var catName = baseProd?.CategoryName ?? "Khác";

                // Tạo 2-3 variant cho MỖI sản phẩm
                int variantCount = random.Next(2, 4); 

                for (int i = 0; i < variantCount; i++)
                {
                    string color = genericColors[random.Next(genericColors.Length)];
                    string size = "Tiêu chuẩn";

                    if (catName == "Thời trang & Giày dép")
                    {
                        size = genericSizes[random.Next(genericSizes.Length)];
                    }
                    else if (catName == "Điện thoại & Máy tính")
                    {
                        size = techSpecs[random.Next(techSpecs.Length)];
                    }
                    
                    variants.Add(new ProductVariant
                    {
                        ProductId = prod.Id,
                        Color = color,
                        Size = size,
                        Sku = $"SKU-{prod.Slug.ToUpper()}-{color[0]}{size[0]}-{random.Next(100, 999)}",
                        Price = prod.BasePrice + random.Next(0, 5) * 50000m,
                        StockQuantity = random.Next(10, 50),
                        IsActive = true,
                        ImageUrl = prod.ImageUrl
                    });
                }
            }

            _db.ProductVariants.AddRange(variants);
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

            // 6. Seed Reviews
            var reviews = new List<Review>();
            foreach (var prod in products)
            {
                int reviewCount = new Random().Next(2, 6); // 2 to 5 reviews per product
                for (int j = 0; j < reviewCount; j++)
                {
                    var user = users[new Random().Next(users.Count)];
                    reviews.Add(new Review {
                        UserId = user.Id,
                        ProductId = prod.Id,
                        Rating = (byte)new Random().Next(3, 6),
                        Title = "Đánh giá chất lượng sản phẩm",
                        Content = "Sản phẩm dùng rất tốt, đáng tiền, giao hàng nhanh chóng, đóng gói cẩn thận. Mình rất ưng ý với thái độ phục vụ của shop.",
                        IsVerifiedPurchase = true,
                        HelpfulCount = new Random().Next(0, 50),
                        Status = "approved",
                        CreatedAt = now.AddDays(-new Random().Next(1, 30))
                    });
                }
            }
            _db.Reviews.AddRange(reviews);
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
