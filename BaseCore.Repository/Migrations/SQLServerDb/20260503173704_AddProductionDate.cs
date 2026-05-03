using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    /// <inheritdoc />
    public partial class AddProductionDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetails_Orders_OrderId",
                table: "OrderDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetails_Orders_OrderId1",
                table: "OrderDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetails_Products_ProductId",
                table: "OrderDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Users",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_UserName",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Products",
                table: "Products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                table: "Orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDetails",
                table: "OrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_OrderDetails_OrderId1",
                table: "OrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_OrderDetails_ProductId",
                table: "OrderDetails");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Categories",
                table: "Categories");

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DropColumn(
                name: "Contact",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Salt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserType",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingAddress",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderId1",
                table: "OrderDetails");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "OrderDetails");

            migrationBuilder.EnsureSchema(
                name: "orders");

            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.EnsureSchema(
                name: "auth");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "users",
                newSchema: "auth");

            migrationBuilder.RenameTable(
                name: "Products",
                newName: "products",
                newSchema: "catalog");

            migrationBuilder.RenameTable(
                name: "Orders",
                newName: "bills",
                newSchema: "orders");

            migrationBuilder.RenameTable(
                name: "OrderDetails",
                newName: "bill_details",
                newSchema: "orders");

            migrationBuilder.RenameTable(
                name: "Categories",
                newName: "product_types",
                newSchema: "catalog");

            migrationBuilder.RenameColumn(
                name: "Phone",
                schema: "auth",
                table: "users",
                newName: "phone");

            migrationBuilder.RenameColumn(
                name: "Email",
                schema: "auth",
                table: "users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "auth",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Password",
                schema: "auth",
                table: "users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "Name",
                schema: "auth",
                table: "users",
                newName: "full_name");

            migrationBuilder.RenameColumn(
                name: "Image",
                schema: "auth",
                table: "users",
                newName: "avatar_url");

            migrationBuilder.RenameColumn(
                name: "Created",
                schema: "auth",
                table: "users",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Name",
                schema: "catalog",
                table: "products",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Description",
                schema: "catalog",
                table: "products",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "catalog",
                table: "products",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                schema: "catalog",
                table: "products",
                newName: "thumbnail_url");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                schema: "catalog",
                table: "products",
                newName: "product_type_id");

            migrationBuilder.RenameColumn(
                name: "Stock",
                schema: "catalog",
                table: "products",
                newName: "view_count");

            migrationBuilder.RenameIndex(
                name: "IX_Products_CategoryId",
                schema: "catalog",
                table: "products",
                newName: "IX_products_product_type_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "orders",
                table: "bills",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                schema: "orders",
                table: "bills",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                schema: "orders",
                table: "bills",
                newName: "total_amount");

            migrationBuilder.RenameColumn(
                name: "Status",
                schema: "orders",
                table: "bills",
                newName: "shipping_address_full");

            migrationBuilder.RenameColumn(
                name: "OrderDate",
                schema: "orders",
                table: "bills",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "Quantity",
                schema: "orders",
                table: "bill_details",
                newName: "quantity");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "orders",
                table: "bill_details",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UnitPrice",
                schema: "orders",
                table: "bill_details",
                newName: "unit_price");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                schema: "orders",
                table: "bill_details",
                newName: "bill_id");

            migrationBuilder.RenameIndex(
                name: "IX_OrderDetails_OrderId",
                schema: "orders",
                table: "bill_details",
                newName: "IX_bill_details_bill_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                schema: "catalog",
                table: "product_types",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Description",
                schema: "catalog",
                table: "product_types",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "catalog",
                table: "product_types",
                newName: "id");

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                schema: "auth",
                table: "users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "email",
                schema: "auth",
                table: "users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<long>(
                name: "id",
                schema: "auth",
                table: "users",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "password_hash",
                schema: "auth",
                table: "users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                schema: "auth",
                table: "users",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                schema: "auth",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "email_verified_at",
                schema: "auth",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "last_login_at",
                schema: "auth",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "role",
                schema: "auth",
                table: "users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "status",
                schema: "auth",
                table: "users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                schema: "auth",
                table: "users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "catalog",
                table: "products",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "catalog",
                table: "products",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<long>(
                name: "id",
                schema: "catalog",
                table: "products",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "thumbnail_url",
                schema: "catalog",
                table: "products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProductionDate",
                schema: "catalog",
                table: "products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "base_price",
                schema: "catalog",
                table: "products",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "collection_id",
                schema: "catalog",
                table: "products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                schema: "catalog",
                table: "products",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                schema: "catalog",
                table: "products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "catalog",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_featured",
                schema: "catalog",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "short_description",
                schema: "catalog",
                table: "products",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "slug",
                schema: "catalog",
                table: "products",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "sold_count",
                schema: "catalog",
                table: "products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "supplier_id",
                schema: "catalog",
                table: "products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                schema: "catalog",
                table: "products",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<long>(
                name: "id",
                schema: "orders",
                table: "bills",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<long>(
                name: "user_id",
                schema: "orders",
                table: "bills",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_amount",
                schema: "orders",
                table: "bills",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AddColumn<string>(
                name: "cancelled_reason",
                schema: "orders",
                table: "bills",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "coupon_code",
                schema: "orders",
                table: "bills",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                schema: "orders",
                table: "bills",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "discount_amount",
                schema: "orders",
                table: "bills",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "guest_email",
                schema: "orders",
                table: "bills",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "note",
                schema: "orders",
                table: "bills",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "order_code",
                schema: "orders",
                table: "bills",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "order_status",
                schema: "orders",
                table: "bills",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "payment_method",
                schema: "orders",
                table: "bills",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "payment_status",
                schema: "orders",
                table: "bills",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "receiver_name",
                schema: "orders",
                table: "bills",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "receiver_phone",
                schema: "orders",
                table: "bills",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "shipping_fee",
                schema: "orders",
                table: "bills",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "subtotal",
                schema: "orders",
                table: "bills",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "tax_amount",
                schema: "orders",
                table: "bills",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<long>(
                name: "id",
                schema: "orders",
                table: "bill_details",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<decimal>(
                name: "unit_price",
                schema: "orders",
                table: "bill_details",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<long>(
                name: "bill_id",
                schema: "orders",
                table: "bill_details",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "color_snapshot",
                schema: "orders",
                table: "bill_details",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "product_name_snapshot",
                schema: "orders",
                table: "bill_details",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "product_variant_id",
                schema: "orders",
                table: "bill_details",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "size_snapshot",
                schema: "orders",
                table: "bill_details",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sku_snapshot",
                schema: "orders",
                table: "bill_details",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "total_price",
                schema: "orders",
                table: "bill_details",
                type: "decimal(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "catalog",
                table: "product_types",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                schema: "catalog",
                table: "product_types",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "catalog",
                table: "product_types",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "parent_id",
                schema: "catalog",
                table: "product_types",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "slug",
                schema: "catalog",
                table: "product_types",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                schema: "catalog",
                table: "product_types",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_users",
                schema: "auth",
                table: "users",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_products",
                schema: "catalog",
                table: "products",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_bills",
                schema: "orders",
                table: "bills",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_bill_details",
                schema: "orders",
                table: "bill_details",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_product_types",
                schema: "catalog",
                table: "product_types",
                column: "id");

            migrationBuilder.CreateTable(
                name: "LogActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IPAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocalName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedUser = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogActions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogErrors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Header = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedUser = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogErrors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "product_variants",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    size = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    sku = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    price = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    sale_price = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    stock_quantity = table.Column<int>(type: "int", nullable: false),
                    weight_gram = table.Column<int>(type: "int", nullable: true),
                    image_url = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_variants", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_variants_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalog",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                schema: "auth",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_slug",
                schema: "catalog",
                table: "products",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bills_order_code",
                schema: "orders",
                table: "bills",
                column: "order_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bills_user_id",
                schema: "orders",
                table: "bills",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_bill_details_product_variant_id",
                schema: "orders",
                table: "bill_details",
                column: "product_variant_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_types_parent_id",
                schema: "catalog",
                table: "product_types",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_types_slug",
                schema: "catalog",
                table: "product_types",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_variants_product_id",
                schema: "catalog",
                table: "product_variants",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_variants_sku",
                schema: "catalog",
                table: "product_variants",
                column: "sku",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_bill_details_bills_bill_id",
                schema: "orders",
                table: "bill_details",
                column: "bill_id",
                principalSchema: "orders",
                principalTable: "bills",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_bill_details_product_variants_product_variant_id",
                schema: "orders",
                table: "bill_details",
                column: "product_variant_id",
                principalSchema: "catalog",
                principalTable: "product_variants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_bills_users_user_id",
                schema: "orders",
                table: "bills",
                column: "user_id",
                principalSchema: "auth",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_product_types_product_types_parent_id",
                schema: "catalog",
                table: "product_types",
                column: "parent_id",
                principalSchema: "catalog",
                principalTable: "product_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_products_product_types_product_type_id",
                schema: "catalog",
                table: "products",
                column: "product_type_id",
                principalSchema: "catalog",
                principalTable: "product_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bill_details_bills_bill_id",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropForeignKey(
                name: "FK_bill_details_product_variants_product_variant_id",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropForeignKey(
                name: "FK_bills_users_user_id",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropForeignKey(
                name: "FK_product_types_product_types_parent_id",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropForeignKey(
                name: "FK_products_product_types_product_type_id",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropTable(
                name: "LogActions");

            migrationBuilder.DropTable(
                name: "LogErrors");

            migrationBuilder.DropTable(
                name: "product_variants",
                schema: "catalog");

            migrationBuilder.DropPrimaryKey(
                name: "PK_users",
                schema: "auth",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_email",
                schema: "auth",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_products",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_products_slug",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_product_types",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropIndex(
                name: "IX_product_types_parent_id",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropIndex(
                name: "IX_product_types_slug",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropPrimaryKey(
                name: "PK_bills",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropIndex(
                name: "IX_bills_order_code",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropIndex(
                name: "IX_bills_user_id",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropPrimaryKey(
                name: "PK_bill_details",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropIndex(
                name: "IX_bill_details_product_variant_id",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_verified_at",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "last_login_at",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "role",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ProductionDate",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "base_price",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "collection_id",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "created_at",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "is_featured",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "short_description",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "slug",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "sold_count",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "supplier_id",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "image_url",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropColumn(
                name: "parent_id",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropColumn(
                name: "slug",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropColumn(
                name: "sort_order",
                schema: "catalog",
                table: "product_types");

            migrationBuilder.DropColumn(
                name: "cancelled_reason",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "coupon_code",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "created_at",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "discount_amount",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "guest_email",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "note",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "order_code",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "order_status",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "payment_method",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "payment_status",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "receiver_name",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "receiver_phone",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "shipping_fee",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "subtotal",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "tax_amount",
                schema: "orders",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "color_snapshot",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "product_name_snapshot",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "product_variant_id",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "size_snapshot",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "sku_snapshot",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.DropColumn(
                name: "total_price",
                schema: "orders",
                table: "bill_details");

            migrationBuilder.RenameTable(
                name: "users",
                schema: "auth",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "products",
                schema: "catalog",
                newName: "Products");

            migrationBuilder.RenameTable(
                name: "product_types",
                schema: "catalog",
                newName: "Categories");

            migrationBuilder.RenameTable(
                name: "bills",
                schema: "orders",
                newName: "Orders");

            migrationBuilder.RenameTable(
                name: "bill_details",
                schema: "orders",
                newName: "OrderDetails");

            migrationBuilder.RenameColumn(
                name: "phone",
                table: "Users",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "Users",
                newName: "Password");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "Users",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "avatar_url",
                table: "Users",
                newName: "Image");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Products",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Products",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Products",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "thumbnail_url",
                table: "Products",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "product_type_id",
                table: "Products",
                newName: "CategoryId");

            migrationBuilder.RenameColumn(
                name: "view_count",
                table: "Products",
                newName: "Stock");

            migrationBuilder.RenameIndex(
                name: "IX_products_product_type_id",
                table: "Products",
                newName: "IX_Products_CategoryId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Categories",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Categories",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Categories",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Orders",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Orders",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "total_amount",
                table: "Orders",
                newName: "TotalAmount");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Orders",
                newName: "OrderDate");

            migrationBuilder.RenameColumn(
                name: "shipping_address_full",
                table: "Orders",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "quantity",
                table: "OrderDetails",
                newName: "Quantity");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "OrderDetails",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "unit_price",
                table: "OrderDetails",
                newName: "UnitPrice");

            migrationBuilder.RenameColumn(
                name: "bill_id",
                table: "OrderDetails",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_bill_details_bill_id",
                table: "OrderDetails",
                newName: "IX_OrderDetails_OrderId");

            migrationBuilder.AlterColumn<string>(
                name: "Phone",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Users",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "Password",
                table: "Users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Image",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Contact",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte[]>(
                name: "Salt",
                table: "Users",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "UserName",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UserType",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Products",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Products",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Products",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Categories",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Orders",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AddColumn<string>(
                name: "ShippingAddress",
                table: "Orders",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "OrderDetails",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "OrderDetails",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "OrderDetails",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<int>(
                name: "OrderId1",
                table: "OrderDetails",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "OrderDetails",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Products",
                table: "Products",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Categories",
                table: "Categories",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDetails",
                table: "OrderDetails",
                column: "Id");

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "Electronic devices and gadgets", "Electronics" },
                    { 2, "Apparel and fashion items", "Clothing" },
                    { 3, "Books and publications", "Books" },
                    { 4, "Home and garden products", "Home & Garden" },
                    { 5, "Sports equipment and accessories", "Sports" }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CategoryId", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[,]
                {
                    { 1, 1, "High-performance laptop", "", "Laptop Dell XPS 15", 35000000m, 10 },
                    { 2, 1, "Latest Apple smartphone", "", "iPhone 15 Pro", 28000000m, 15 },
                    { 3, 2, "Comfortable cotton t-shirt", "", "T-Shirt Cotton", 250000m, 100 },
                    { 4, 3, "Learn programming basics", "", "Programming Book", 450000m, 50 },
                    { 5, 4, "Complete gardening toolkit", "", "Garden Tools Set", 850000m, 25 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_UserName",
                table: "Users",
                column: "UserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetails_OrderId1",
                table: "OrderDetails",
                column: "OrderId1");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetails_ProductId",
                table: "OrderDetails",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetails_Orders_OrderId",
                table: "OrderDetails",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetails_Orders_OrderId1",
                table: "OrderDetails",
                column: "OrderId1",
                principalTable: "Orders",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetails_Products_ProductId",
                table: "OrderDetails",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
