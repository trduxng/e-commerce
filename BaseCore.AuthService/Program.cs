using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.Authen;
using BaseCore.Services.Authen;
using System.Text;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BaseCore Auth Service API",
        Version = "v1",
        Description = "Authentication Microservice - Login, Register, User Management (Bài 10, 11)"
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
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

// SQL Server Configuration
builder.Services.AddDbContext<SQLServerDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("ConnectedDb"));
});
// DI for Authentication Services and Repositories only
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// JWT Authentication Key
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

// Auto migrate database and Seed
using (var scope = app.Services.CreateScope())
{
    BaseCore.Repository.DbInitializer.Initialize(scope.ServiceProvider);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("BaseCore Auth Service running on port 5003");
Console.WriteLine("Endpoints: /api/auth, /api/users, /api/roles");
app.Run();

static void SeedUsers(SQLServerDbContext db)
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
