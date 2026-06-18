using BaseCore.Repository;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    [DbContext(typeof(SQLServerDbContext))]
    [Migration("20260618090000_OneReviewPerOrderDetail")]
    public partial class OneReviewPerOrderDetail : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_product_reviews_bill_detail_id",
                schema: "catalog",
                table: "product_reviews");

            migrationBuilder.DropIndex(
                name: "IX_product_reviews_user_id_product_id",
                schema: "catalog",
                table: "product_reviews");

            migrationBuilder.CreateIndex(
                name: "IX_product_reviews_bill_detail_id",
                schema: "catalog",
                table: "product_reviews",
                column: "bill_detail_id",
                unique: true,
                filter: "[bill_detail_id] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_product_reviews_bill_detail_id",
                schema: "catalog",
                table: "product_reviews");

            migrationBuilder.CreateIndex(
                name: "IX_product_reviews_bill_detail_id",
                schema: "catalog",
                table: "product_reviews",
                column: "bill_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_reviews_user_id_product_id",
                schema: "catalog",
                table: "product_reviews",
                columns: new[] { "user_id", "product_id" },
                unique: true);
        }
    }
}
