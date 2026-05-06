using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();

// Swagger Configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BaseCore API Service",
        Version = "v1",
        Description = "Business Logic Microservice - Products, Categories, Orders (Bài 10, 11)"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

//MySQL Configuration with EF Core
//var connectionString = builder.Configuration.GetConnectionString("MySQL")
//    ?? "Server=localhost;Database=BaseCoreSales;User=root;Password=;";
//builder.Services.AddDbContext<MySqlDbContext>(options =>
//    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));



builder.Services.AddDbContext<SQLServerDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("ConnectedDb"));
});


// Repository Registration - Products, Categories, Orders
builder.Services.AddScoped<IProductRepositoryEF, ProductRepositoryEF>();
builder.Services.AddScoped<ICategoryRepositoryEF, CategoryRepositoryEF>();
builder.Services.AddScoped<IOrderRepositoryEF, OrderRepositoryEF>();
builder.Services.AddScoped<IOrderDetailRepositoryEF, OrderDetailRepositoryEF>();

// JWT Authentication
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? "YourSecretKeyForAuthenticationShouldBeLongEnough");
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// Auto migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SQLServerDbContext>();
    db.Database.EnsureCreated();
    EnsureCartTables(db);
    SeedCatalogData(db);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("BaseCore API Service running on port 5001");
Console.WriteLine("Endpoints: /api/products, /api/categories, /api/orders");
app.Run();

static void SeedCatalogData(SQLServerDbContext db)
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
    };

    foreach (var seed in productSeeds)
    {
        if (!db.Products.Any(product => product.Slug == seed.Slug))
        {
            db.Products.Add(seed);
        }
    }

    db.SaveChanges();
}

static void EnsureCartTables(SQLServerDbContext db)
{
    db.Database.ExecuteSqlRaw(@"
IF SCHEMA_ID(N'orders') IS NULL
    EXEC(N'CREATE SCHEMA [orders]');

IF OBJECT_ID(N'[orders].[carts]', N'U') IS NULL
BEGIN
    CREATE TABLE [orders].[carts] (
        [id] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_carts] PRIMARY KEY,
        [user_id] BIGINT NOT NULL,
        [created_at] DATETIME2 NOT NULL,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [FK_carts_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [auth].[users]([id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_carts_user_id' AND [object_id] = OBJECT_ID(N'[orders].[carts]'))
    CREATE UNIQUE INDEX [IX_carts_user_id] ON [orders].[carts]([user_id]);

IF COL_LENGTH(N'[orders].[carts]', N'created_at') IS NULL
    ALTER TABLE [orders].[carts] ADD [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_carts_created_at] DEFAULT SYSDATETIME();

IF COL_LENGTH(N'[orders].[carts]', N'updated_at') IS NULL
    ALTER TABLE [orders].[carts] ADD [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_carts_updated_at] DEFAULT SYSDATETIME();

IF OBJECT_ID(N'[orders].[cart_items]', N'U') IS NULL
BEGIN
    CREATE TABLE [orders].[cart_items] (
        [id] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_cart_items] PRIMARY KEY,
        [cart_id] BIGINT NOT NULL,
        [product_variant_id] BIGINT NOT NULL,
        [quantity] INT NOT NULL,
        [price_snapshot] DECIMAL(15, 2) NOT NULL,
        [product_name_snapshot] NVARCHAR(255) NULL,
        [image_url_snapshot] NVARCHAR(1000) NULL,
        [sku_snapshot] NVARCHAR(120) NULL,
        [size_snapshot] NVARCHAR(20) NULL,
        [color_snapshot] NVARCHAR(50) NULL,
        [created_at] DATETIME2 NOT NULL,
        [updated_at] DATETIME2 NOT NULL,
        CONSTRAINT [FK_cart_items_carts_cart_id] FOREIGN KEY ([cart_id]) REFERENCES [orders].[carts]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_cart_items_product_variants_product_variant_id] FOREIGN KEY ([product_variant_id]) REFERENCES [catalog].[product_variants]([id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_cart_items_cart_variant' AND [object_id] = OBJECT_ID(N'[orders].[cart_items]'))
    CREATE UNIQUE INDEX [IX_cart_items_cart_variant] ON [orders].[cart_items]([cart_id], [product_variant_id]);

IF COL_LENGTH(N'[orders].[cart_items]', N'price_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [price_snapshot] DECIMAL(15, 2) NOT NULL CONSTRAINT [DF_cart_items_price_snapshot] DEFAULT 0;

IF COL_LENGTH(N'[orders].[cart_items]', N'product_name_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [product_name_snapshot] NVARCHAR(255) NULL;

IF COL_LENGTH(N'[orders].[cart_items]', N'image_url_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [image_url_snapshot] NVARCHAR(1000) NULL;

IF COL_LENGTH(N'[orders].[cart_items]', N'sku_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [sku_snapshot] NVARCHAR(120) NULL;

IF COL_LENGTH(N'[orders].[cart_items]', N'size_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [size_snapshot] NVARCHAR(20) NULL;

IF COL_LENGTH(N'[orders].[cart_items]', N'color_snapshot') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [color_snapshot] NVARCHAR(50) NULL;

IF COL_LENGTH(N'[orders].[cart_items]', N'created_at') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_cart_items_created_at] DEFAULT SYSDATETIME();

IF COL_LENGTH(N'[orders].[cart_items]', N'updated_at') IS NULL
    ALTER TABLE [orders].[cart_items] ADD [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_cart_items_updated_at] DEFAULT SYSDATETIME();
");
}

static Product CreateProduct(
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
        ProductVariants = new List<ProductVariant>
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
