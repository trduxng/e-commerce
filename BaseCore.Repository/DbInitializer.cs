using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace BaseCore.Repository
{
    public static class DbInitializer
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new SQLServerDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<SQLServerDbContext>>()))
            {
                // Automatically apply pending migrations
                if (context.Database.GetPendingMigrations().Any())
                {
                    context.Database.Migrate();
                }
                else
                {
                    context.Database.EnsureCreated();
                }

                SeedUsers(context);
                SeedCatalogData(context);
            }
        }

        private static void SeedUsers(SQLServerDbContext db)
        {
            var now = DateTime.Now;

            if (!db.Users.Any(user => user.Email == "admin@basecore.local"))
            {
                db.Users.Add(new User
                {
                    Email = "admin@basecore.local",
                    Password = "admin123",
                    Name = "BaseCore Admin",
                    Phone = "0900000001",
                    Role = "admin",
                    Status = "active",
                    EmailVerifiedAt = now,
                    Created = now,
                    UpdatedAt = now,
                });
            }

            if (!db.Users.Any(user => user.Email == "customer@basecore.local"))
            {
                db.Users.Add(new User
                {
                    Email = "customer@basecore.local",
                    Password = "customer123",
                    Name = "Demo Customer",
                    Phone = "0900000002",
                    Role = "customer",
                    Status = "active",
                    EmailVerifiedAt = now,
                    Created = now,
                    UpdatedAt = now,
                });
            }

            db.SaveChanges();
        }

        private static void SeedCatalogData(SQLServerDbContext db)
        {
            var now = DateTime.Now;

            var categorySeeds = new[]
            {
                new Category { Name = "Electronics", Slug = "electronics", Description = "Phones, audio devices and useful gadgets", ImageUrl = "/img/cat-1.jpg", SortOrder = 1, IsActive = true },
                new Category { Name = "Fashion", Slug = "fashion", Description = "Daily wear, shoes and accessories", ImageUrl = "/img/cat-2.jpg", SortOrder = 2, IsActive = true },
                new Category { Name = "Home Living", Slug = "home-living", Description = "Home, kitchen and desk essentials", ImageUrl = "/img/cat-3.jpg", SortOrder = 3, IsActive = true },
                new Category { Name = "Sports", Slug = "sports", Description = "Training gear and active lifestyle products", ImageUrl = "/img/cat-4.jpg", SortOrder = 4, IsActive = true },
            };

            foreach (var seed in categorySeeds)
            {
                if (!db.Categories.Any(category => category.Slug == seed.Slug))
                {
                    db.Categories.Add(seed);
                }
            }

            db.SaveChanges();

            var categories = db.Categories.ToDictionary(category => category.Slug, category => category.Id);
            var productSeeds = new[]
            {
                CreateProduct("Wireless Studio Headphones", "wireless-studio-headphones", categories["electronics"], 2490000, 24, "/img/product-1.jpg", "Comfortable over-ear headphones with clear sound and long battery life.", "AUDIO-HEADPHONE-001", true, now),
                CreateProduct("Smart Fitness Watch", "smart-fitness-watch", categories["electronics"], 1890000, 38, "/img/product-2.jpg", "Track workouts, notifications and health metrics from one bright display.", "WATCH-FIT-001", true, now),
                CreateProduct("Portable Bluetooth Speaker", "portable-bluetooth-speaker", categories["electronics"], 890000, 33, "/img/product-9.jpg", "Compact water-resistant speaker with clear sound for travel.", "AUDIO-SPEAKER-001", false, now),
                CreateProduct("Classic Cotton Shirt", "classic-cotton-shirt", categories["fashion"], 420000, 62, "/img/product-3.jpg", "Breathable cotton shirt with a clean regular fit.", "FASHION-SHIRT-001", true, now),
                CreateProduct("Leather Travel Backpack", "leather-travel-backpack", categories["fashion"], 1350000, 19, "/img/product-4.jpg", "Structured backpack with laptop storage and durable zippers.", "BAG-TRAVEL-001", true, now),
                CreateProduct("Running Training Shoes", "running-training-shoes", categories["sports"], 1680000, 29, "/img/product-7.jpg", "Lightweight shoes with stable cushioning for gym and road runs.", "SPORT-SHOES-001", true, now),
                CreateProduct("Yoga Essentials Mat", "yoga-essentials-mat", categories["sports"], 490000, 54, "/img/product-8.jpg", "Non-slip mat with balanced cushioning for yoga and stretching.", "SPORT-YOGA-001", false, now),
                CreateProduct("Ceramic Coffee Set", "ceramic-coffee-set", categories["home-living"], 690000, 31, "/img/product-5.jpg", "Minimal ceramic cups and saucers for coffee and tea.", "HOME-COFFEE-001", true, now),
                CreateProduct("Compact Desk Lamp", "compact-desk-lamp", categories["home-living"], 560000, 47, "/img/product-6.jpg", "Adjustable LED lamp with warm and cool lighting modes.", "HOME-LAMP-001", false, now),
                
                // Add the two seeds from the SQL script
                CreateProduct("MacBook Pro M3", "macbook-pro-m3", categories["electronics"], 1599, 50, "/img/macbook.jpg", "Apple MacBook Pro M3 14 inch", "MBP-M3-SILVER", true, now),
                CreateProduct("iPhone 15 Pro", "iphone-15-pro", categories["electronics"], 1099, 100, "/img/iphone.jpg", "Apple iPhone 15 Pro 256GB", "IP15P-TITAN", true, now),
            };

            var existingProductSlugs = db.Products
                .Select(product => product.Slug)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var existingVariantSkus = db.ProductVariants
                .Select(variant => variant.Sku)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var seed in productSeeds)
            {
                var seedSkus = seed.ProductVariants
                    .Select(variant => variant.Sku)
                    .ToList();
                var hasDuplicateSku = seedSkus.Any(existingVariantSkus.Contains);

                if (existingProductSlugs.Contains(seed.Slug) || hasDuplicateSku)
                    continue;

                db.Products.Add(seed);
                existingProductSlugs.Add(seed.Slug);
                foreach (var sku in seedSkus)
                    existingVariantSkus.Add(sku);
            }

            db.SaveChanges();
        }

        private static Product CreateProduct(
            string name,
            string slug,
            int categoryId,
            decimal price,
            int stock,
            string imageUrl,
            string description,
            string sku,
            bool featured,
            DateTime now)
        {
            return new Product
            {
                Name = name,
                Slug = slug,
                CategoryId = categoryId,
                BasePrice = price,
                ShortDescription = description,
                Description = description,
                ImageUrl = imageUrl,
                IsActive = true,
                IsFeatured = featured,
                CreatedAt = now,
                UpdatedAt = now,
                ProductVariants = new System.Collections.Generic.List<ProductVariant>
                {
                    new()
                    {
                        Sku = sku,
                        Price = price,
                        StockQuantity = stock,
                        ImageUrl = imageUrl,
                        IsActive = true,
                    }
                }
            };
        }
    }
}
