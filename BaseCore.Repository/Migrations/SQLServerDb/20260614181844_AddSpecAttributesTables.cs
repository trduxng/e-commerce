using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    /// <inheritdoc />
    public partial class AddSpecAttributesTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_products_Manufacturers_ManufacturerId",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Manufacturers",
                table: "Manufacturers");

            migrationBuilder.RenameTable(
                name: "Manufacturers",
                newName: "manufacturers",
                newSchema: "catalog");

            migrationBuilder.RenameColumn(
                name: "ManufacturerId",
                schema: "catalog",
                table: "products",
                newName: "manufacturer_id");

            migrationBuilder.RenameIndex(
                name: "IX_products_ManufacturerId",
                schema: "catalog",
                table: "products",
                newName: "IX_products_manufacturer_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                schema: "catalog",
                table: "manufacturers",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Description",
                schema: "catalog",
                table: "manufacturers",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                schema: "catalog",
                table: "manufacturers",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                schema: "catalog",
                table: "manufacturers",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                schema: "catalog",
                table: "manufacturers",
                newName: "sort_order");

            migrationBuilder.RenameColumn(
                name: "PictureUrl",
                schema: "catalog",
                table: "manufacturers",
                newName: "picture_url");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                schema: "catalog",
                table: "manufacturers",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                schema: "catalog",
                table: "manufacturers",
                newName: "created_at");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "catalog",
                table: "manufacturers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "catalog",
                table: "manufacturers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "picture_url",
                schema: "catalog",
                table: "manufacturers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_manufacturers",
                schema: "catalog",
                table: "manufacturers",
                column: "id");

            migrationBuilder.CreateTable(
                name: "specification_attributes",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specification_attributes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_specifications",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    specification_attribute_id = table.Column<int>(type: "int", nullable: false),
                    value = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_specifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_specifications_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalog",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_specifications_specification_attributes_specification_attribute_id",
                        column: x => x.specification_attribute_id,
                        principalSchema: "catalog",
                        principalTable: "specification_attributes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_specifications_product_id",
                schema: "catalog",
                table: "product_specifications",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_specifications_specification_attribute_id",
                schema: "catalog",
                table: "product_specifications",
                column: "specification_attribute_id");

            migrationBuilder.AddForeignKey(
                name: "FK_products_manufacturers_manufacturer_id",
                schema: "catalog",
                table: "products",
                column: "manufacturer_id",
                principalSchema: "catalog",
                principalTable: "manufacturers",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_products_manufacturers_manufacturer_id",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropTable(
                name: "product_specifications",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "specification_attributes",
                schema: "catalog");

            migrationBuilder.DropPrimaryKey(
                name: "PK_manufacturers",
                schema: "catalog",
                table: "manufacturers");

            migrationBuilder.RenameTable(
                name: "manufacturers",
                schema: "catalog",
                newName: "Manufacturers");

            migrationBuilder.RenameColumn(
                name: "manufacturer_id",
                schema: "catalog",
                table: "products",
                newName: "ManufacturerId");

            migrationBuilder.RenameIndex(
                name: "IX_products_manufacturer_id",
                schema: "catalog",
                table: "products",
                newName: "IX_products_ManufacturerId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Manufacturers",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Manufacturers",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Manufacturers",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Manufacturers",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "sort_order",
                table: "Manufacturers",
                newName: "SortOrder");

            migrationBuilder.RenameColumn(
                name: "picture_url",
                table: "Manufacturers",
                newName: "PictureUrl");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Manufacturers",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Manufacturers",
                newName: "CreatedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Manufacturers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Manufacturers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PictureUrl",
                table: "Manufacturers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Manufacturers",
                table: "Manufacturers",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_products_Manufacturers_ManufacturerId",
                schema: "catalog",
                table: "products",
                column: "ManufacturerId",
                principalTable: "Manufacturers",
                principalColumn: "Id");
        }
    }
}
