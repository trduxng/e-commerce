using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    /// <inheritdoc />
    public partial class AddCheckoutAttributesAndSpecialProductFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "download_url",
                schema: "catalog",
                table: "products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_digital",
                schema: "catalog",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_rental",
                schema: "catalog",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "rental_price_length",
                schema: "catalog",
                table: "products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rental_price_period",
                schema: "catalog",
                table: "products",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "checkout_attributes",
                schema: "sales",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    control_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    is_required = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checkout_attributes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "checkout_attribute_values",
                schema: "sales",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    checkout_attribute_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    price_adjustment = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    is_preselected = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checkout_attribute_values", x => x.id);
                    table.ForeignKey(
                        name: "FK_checkout_attribute_values_checkout_attributes_checkout_attribute_id",
                        column: x => x.checkout_attribute_id,
                        principalSchema: "sales",
                        principalTable: "checkout_attributes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_checkout_attribute_values_checkout_attribute_id",
                schema: "sales",
                table: "checkout_attribute_values",
                column: "checkout_attribute_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "checkout_attribute_values",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "checkout_attributes",
                schema: "sales");

            migrationBuilder.DropColumn(
                name: "download_url",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "is_digital",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "is_rental",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "rental_price_length",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropColumn(
                name: "rental_price_period",
                schema: "catalog",
                table: "products");
        }
    }
}
