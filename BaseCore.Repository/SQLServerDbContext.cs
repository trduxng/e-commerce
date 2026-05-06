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
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<LogAction> LogActions { get; set; }
        public DbSet<LogError> LogErrors { get; set; }
        
        // New Entities
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Collection> Collections { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<AdminLog> AdminLogs { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<OrderStatusLog> OrderStatusLogs { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
        public DbSet<Banner> Banners { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Schema: auth
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
                entity.Property(e => e.Role).HasColumnName("role").HasMaxLength(20).HasDefaultValue("customer");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("unverified");
                entity.Property(e => e.EmailVerifiedAt).HasColumnName("email_verified_at");
                entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
                entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
                entity.Property(e => e.Created).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.ToTable("user_addresses", "auth");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ReceiverName).HasColumnName("receiver_name").IsRequired();
                entity.Property(e => e.Phone).HasColumnName("phone").IsRequired();
                entity.Property(e => e.Province).HasColumnName("province").IsRequired();
                entity.Property(e => e.District).HasColumnName("district").IsRequired();
                entity.Property(e => e.Ward).HasColumnName("ward").IsRequired();
                entity.Property(e => e.AddressDetail).HasColumnName("address_detail").IsRequired();
                entity.Property(e => e.IsDefault).HasColumnName("is_default");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<AdminLog>(entity =>
            {
                entity.ToTable("admin_logs", "auth");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.AdminId).HasColumnName("admin_id");
                entity.Property(e => e.Action).HasColumnName("action").IsRequired();
                entity.Property(e => e.TargetTable).HasColumnName("target_table").IsRequired();
                entity.Property(e => e.TargetId).HasColumnName("target_id");
                entity.Property(e => e.OldValue).HasColumnName("old_value");
                entity.Property(e => e.NewValue).HasColumnName("new_value");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address");
                entity.Property(e => e.UserAgent).HasColumnName("user_agent");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            // Schema: catalog
            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("product_types", "catalog");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
                entity.Property(e => e.ParentId).HasColumnName("parent_id");
                entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasOne(e => e.Parent)
                      .WithMany()
                      .HasForeignKey(e => e.ParentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("suppliers", "catalog");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").IsRequired();
                entity.Property(e => e.Country).HasColumnName("country").HasDefaultValue("Vietnam");
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("active");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<Collection>(entity =>
            {
                entity.ToTable("collections", "catalog");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").IsRequired();
                entity.Property(e => e.Slug).HasColumnName("slug").IsRequired();
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.HasIndex(e => e.Slug).IsUnique();
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("products", "catalog");
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
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasColumnName("is_featured").HasDefaultValue(false);
                entity.Property(e => e.SoldCount).HasColumnName("sold_count").HasDefaultValue(0);
                entity.Property(e => e.ViewCount).HasColumnName("view_count").HasDefaultValue(0);
                entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.Slug).IsUnique();

                entity.HasOne(e => e.Category)
                      .WithMany(e => e.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProductVariant>(entity =>
            {
                entity.ToTable("product_variants", "catalog");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.Size).HasColumnName("size").HasMaxLength(20);
                entity.Property(e => e.Color).HasColumnName("color").HasMaxLength(50);
                entity.Property(e => e.Sku).HasColumnName("sku").HasMaxLength(120).IsRequired();
                entity.Property(e => e.Price).HasColumnName("price").HasPrecision(15, 2);
                entity.Property(e => e.SalePrice).HasColumnName("sale_price").HasPrecision(15, 2);
                entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity").HasDefaultValue(0);
                entity.Property(e => e.WeightGram).HasColumnName("weight_gram");
                entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(1000);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.HasIndex(e => e.Sku).IsUnique();
                entity.HasOne(e => e.Product)
                      .WithMany(e => e.ProductVariants)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.ToTable("product_images", "catalog");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.ImageUrl).HasColumnName("image_url").IsRequired();
                entity.Property(e => e.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
                entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            });

            modelBuilder.Entity<Tag>(entity =>
            {
                entity.ToTable("tags", "catalog");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").IsRequired();
                entity.Property(e => e.Slug).HasColumnName("slug").IsRequired();
                entity.HasIndex(e => e.Slug).IsUnique();
            });

            // Schema: orders
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("carts", "orders");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.SessionToken).HasColumnName("session_token");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.ToTable("cart_items", "orders");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.CartId).HasColumnName("cart_id");
                entity.Property(e => e.ProductVariantId).HasColumnName("product_variant_id");
                entity.Property(e => e.Quantity).HasColumnName("quantity");
                entity.Property(e => e.PriceSnapshot).HasColumnName("price_snapshot").HasPrecision(15, 2);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("bills", "orders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.OrderCode).HasColumnName("order_code").HasMaxLength(30).IsRequired();
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.GuestEmail).HasColumnName("guest_email").HasMaxLength(255);
                entity.Property(e => e.ReceiverName).HasColumnName("receiver_name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.ReceiverPhone).HasColumnName("receiver_phone").HasMaxLength(20).IsRequired();
                entity.Property(e => e.ShippingAddressFull).HasColumnName("shipping_address_full").IsRequired();
                entity.Property(e => e.Subtotal).HasColumnName("subtotal").HasPrecision(15, 2);
                entity.Property(e => e.ShippingFee).HasColumnName("shipping_fee").HasPrecision(15, 2).HasDefaultValue(0);
                entity.Property(e => e.DiscountAmount).HasColumnName("discount_amount").HasPrecision(15, 2).HasDefaultValue(0);
                entity.Property(e => e.TaxAmount).HasColumnName("tax_amount").HasPrecision(15, 2).HasDefaultValue(0);
                entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasPrecision(15, 2);
                entity.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasMaxLength(20).IsRequired();
                entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(20).HasDefaultValue("pending");
                entity.Property(e => e.OrderStatus).HasColumnName("order_status").HasMaxLength(20).HasDefaultValue("pending");
                entity.Property(e => e.CouponCode).HasColumnName("coupon_code").HasMaxLength(50);
                entity.Property(e => e.Note).HasColumnName("note").HasMaxLength(1000);
                entity.Property(e => e.CancelledReason).HasColumnName("cancelled_reason").HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.OrderCode).IsUnique();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.ToTable("bill_details", "orders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.OrderId).HasColumnName("bill_id");
                entity.Property(e => e.ProductVariantId).HasColumnName("product_variant_id");
                entity.Property(e => e.ProductNameSnapshot).HasColumnName("product_name_snapshot").HasMaxLength(255).IsRequired();
                entity.Property(e => e.SizeSnapshot).HasColumnName("size_snapshot").HasMaxLength(20);
                entity.Property(e => e.ColorSnapshot).HasColumnName("color_snapshot").HasMaxLength(50);
                entity.Property(e => e.SkuSnapshot).HasColumnName("sku_snapshot").HasMaxLength(120).IsRequired();
                entity.Property(e => e.Quantity).HasColumnName("quantity").HasDefaultValue(1);
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

            modelBuilder.Entity<OrderStatusLog>(entity =>
            {
                entity.ToTable("order_status_logs", "orders");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.BillId).HasColumnName("bill_id");
                entity.Property(e => e.FromStatus).HasColumnName("from_status");
                entity.Property(e => e.ToStatus).HasColumnName("to_status").IsRequired();
                entity.Property(e => e.CreatedBy).HasColumnName("created_by");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            // Schema: reviews
            modelBuilder.Entity<Review>(entity =>
            {
                entity.ToTable("reviews", "reviews");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ProductId).HasColumnName("product_id");
                entity.Property(e => e.BillDetailId).HasColumnName("bill_detail_id");
                entity.Property(e => e.Rating).HasColumnName("rating");
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            // Schema: promotions
            modelBuilder.Entity<Coupon>(entity =>
            {
                entity.ToTable("coupons", "promotions");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Code).HasColumnName("code").IsRequired();
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.HasIndex(e => e.Code).IsUnique();
            });

            // Schema: payment
            modelBuilder.Entity<PaymentTransaction>(entity =>
            {
                entity.ToTable("payment_transactions", "payment");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.BillId).HasColumnName("bill_id");
                entity.Property(e => e.Gateway).HasColumnName("gateway").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<Shipment>(entity =>
            {
                entity.ToTable("shipments", "payment");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.BillId).HasColumnName("bill_id");
                entity.Property(e => e.Carrier).HasColumnName("carrier").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("pending");
            });

            // Schema: operations
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications", "operations");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<InventoryTransaction>(entity =>
            {
                entity.ToTable("inventory_transactions", "operations");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.ProductVariantId).HasColumnName("product_variant_id");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
            });

            modelBuilder.Entity<Banner>(entity =>
            {
                entity.ToTable("banners", "operations");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            });

            modelBuilder.Entity<LogAction>(entity =>
            {
                entity.ToTable("LogActions", "dbo");
            });

            modelBuilder.Entity<LogError>(entity =>
            {
                entity.ToTable("LogErrors", "dbo");
            });
        }
    }
}
