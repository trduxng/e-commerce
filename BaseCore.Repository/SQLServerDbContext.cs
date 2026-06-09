using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository
{
    /// <summary>
    /// Entity Framework Core DbContext for SQLServer
    /// Used for teaching EF Core concepts (Bài 10)
    /// </summary>
    public class SQLServerDbContext : DbContext
    {
        public SQLServerDbContext(DbContextOptions<SQLServerDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<FavoriteProduct> FavoriteProducts { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<LogAction> LogActions { get; set; }
        public DbSet<LogError> LogErrors { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users", "auth");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
                entity.Property(e => e.Password).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
                entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
                entity.Property(e => e.Name).HasColumnName("full_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Image).HasColumnName("avatar_url").HasMaxLength(1000);
                entity.Property(e => e.Role).HasColumnName("role").HasMaxLength(20).IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.EmailVerifiedAt).HasColumnName("email_verified_at");
                entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
                entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
                entity.Property(e => e.Created).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.ToTable("user_addresses", "auth", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ReceiverName).HasColumnName("receiver_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20).IsRequired();
                entity.Property(e => e.Province).HasColumnName("province").HasMaxLength(100).IsRequired();
                entity.Property(e => e.District).HasColumnName("district").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Ward).HasColumnName("ward").HasMaxLength(100).IsRequired();
                entity.Property(e => e.AddressDetail).HasColumnName("address_detail").HasMaxLength(500).IsRequired();
                entity.Property(e => e.IsDefault).HasColumnName("is_default");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => e.UserId);

                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("product_types", "catalog", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
                entity.Property(e => e.ParentId).HasColumnName("parent_id");
                entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.Property(e => e.SortOrder).HasColumnName("sort_order");
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasOne(e => e.Parent)
                      .WithMany()
                      .HasForeignKey(e => e.ParentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("products", "catalog", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
                entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(255).IsRequired();
                entity.Property(e => e.CategoryId).HasColumnName("product_type_id");
                entity.Property(e => e.CollectionId).HasColumnName("collection_id");
                entity.Property(e => e.SupplierId).HasColumnName("supplier_id");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.ShortDescription).HasColumnName("short_description").HasMaxLength(500);
                entity.Property(e => e.BasePrice).HasColumnName("base_price").HasPrecision(15, 2);
                entity.Property(e => e.ImageUrl).HasColumnName("thumbnail_url").HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.Property(e => e.IsFeatured).HasColumnName("is_featured");
                entity.Property(e => e.SoldCount).HasColumnName("sold_count");
                entity.Property(e => e.ViewCount).HasColumnName("view_count");
                entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.HasIndex(e => e.Slug).IsUnique();

                entity.HasOne(e => e.Category)
                      .WithMany(e => e.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<FavoriteProduct>(entity =>
            {
                entity.ToTable("favorite_products", "catalog", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => new { e.UserId, e.ProductId }).IsUnique();

                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("product_reviews", "catalog", table =>
                {
                    table.UseSqlOutputClause(false);
                    table.HasCheckConstraint("CK_product_reviews_rating", "[rating] BETWEEN 1 AND 5");
                });
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.BillDetailId).HasColumnName("bill_detail_id");
                entity.Property(e => e.Rating).HasColumnName("rating");
                entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(150);
                entity.Property(e => e.Content).HasColumnName("content").HasMaxLength(2000).IsRequired();
                entity.Property(e => e.IsVerifiedPurchase).HasColumnName("is_verified_purchase");
                entity.Property(e => e.HelpfulCount).HasColumnName("helpful_count");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(e => e.ProductId);
                entity.HasIndex(e => new { e.UserId, e.ProductId }).IsUnique();

                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany(e => e.Reviews)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.BillDetail)
                      .WithMany()
                      .HasForeignKey(e => e.BillDetailId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ProductVariant>(entity =>
            {
                entity.ToTable("product_variants", "catalog", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.Size).HasColumnName("size").HasMaxLength(20);
                entity.Property(e => e.Color).HasColumnName("color").HasMaxLength(50);
                entity.Property(e => e.Sku).HasColumnName("sku").HasMaxLength(120).IsRequired();
                entity.Property(e => e.Price).HasColumnName("price").HasPrecision(15, 2);
                entity.Property(e => e.SalePrice).HasColumnName("sale_price").HasPrecision(15, 2);
                entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity");
                entity.Property(e => e.WeightGram).HasColumnName("weight_gram");
                entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.HasIndex(e => e.Sku).IsUnique();
                entity.HasOne(e => e.Product)
                      .WithMany(e => e.ProductVariants)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("carts", "orders", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.SessionToken).HasColumnName("session_token").HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.HasIndex(e => e.SessionToken)
      .IsUnique()
      .HasFilter("[session_token] IS NOT NULL");

                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.ToTable("cart_items", "orders", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.CartId).HasColumnName("cart_id");
                entity.Property(e => e.ProductVariantId).HasColumnName("product_variant_id");
                entity.Property(e => e.Quantity).HasColumnName("quantity");
                entity.Property(e => e.PriceSnapshot).HasColumnName("price_snapshot").HasPrecision(15, 2);
                entity.Property(e => e.ProductNameSnapshot).HasColumnName("product_name_snapshot").HasMaxLength(255);
                entity.Property(e => e.ImageUrlSnapshot).HasColumnName("image_url_snapshot").HasMaxLength(1000);
                entity.Property(e => e.SkuSnapshot).HasColumnName("sku_snapshot").HasMaxLength(120);
                entity.Property(e => e.SizeSnapshot).HasColumnName("size_snapshot").HasMaxLength(20);
                entity.Property(e => e.ColorSnapshot).HasColumnName("color_snapshot").HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.HasIndex(e => new { e.CartId, e.ProductVariantId }).IsUnique();

                entity.HasOne(e => e.Cart)
                      .WithMany(e => e.Items)
                      .HasForeignKey(e => e.CartId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ProductVariant)
                      .WithMany()
                      .HasForeignKey(e => e.ProductVariantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("bills", "orders", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.OrderCode).HasColumnName("order_code").HasMaxLength(30).IsRequired();
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.GuestEmail).HasColumnName("guest_email").HasMaxLength(255);
                entity.Property(e => e.ReceiverName).HasColumnName("receiver_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.ReceiverPhone).HasColumnName("receiver_phone").HasMaxLength(20).IsRequired();
                entity.Property(e => e.ShippingAddressFull).HasColumnName("shipping_address_full").IsRequired();
                entity.Property(e => e.Subtotal).HasColumnName("subtotal").HasPrecision(15, 2);
                entity.Property(e => e.ShippingFee).HasColumnName("shipping_fee").HasPrecision(15, 2);
                entity.Property(e => e.DiscountAmount).HasColumnName("discount_amount").HasPrecision(15, 2);
                entity.Property(e => e.TaxAmount).HasColumnName("tax_amount").HasPrecision(15, 2);
                entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasPrecision(15, 2);
                entity.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasMaxLength(20).IsRequired();
                entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.OrderStatus).HasColumnName("order_status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.CouponCode).HasColumnName("coupon_code").HasMaxLength(50);
                entity.Property(e => e.Note).HasColumnName("note").HasMaxLength(1000);
                entity.Property(e => e.CancelledReason).HasColumnName("cancelled_reason").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.HasIndex(e => e.OrderCode).IsUnique();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.ToTable("bill_details", "orders", table => table.UseSqlOutputClause(false));
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.OrderId).HasColumnName("bill_id");
                entity.Property(e => e.ProductVariantId).HasColumnName("product_variant_id");
                entity.Property(e => e.ProductNameSnapshot).HasColumnName("product_name_snapshot").HasMaxLength(255).IsRequired();
                entity.Property(e => e.SizeSnapshot).HasColumnName("size_snapshot").HasMaxLength(20);
                entity.Property(e => e.ColorSnapshot).HasColumnName("color_snapshot").HasMaxLength(50);
                entity.Property(e => e.SkuSnapshot).HasColumnName("sku_snapshot").HasMaxLength(120).IsRequired();
                entity.Property(e => e.Quantity).HasColumnName("quantity");
                entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasPrecision(15, 2);
                entity.Property(e => e.TotalPrice).HasColumnName("total_price").HasPrecision(15, 2);

                entity.HasOne(e => e.Order)
                      .WithMany(e => e.OrderDetails)
                      .HasForeignKey(e => e.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ProductVariant)
                      .WithMany()
                      .HasForeignKey(e => e.ProductVariantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
