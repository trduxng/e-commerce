using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    [DbContext(typeof(SQLServerDbContext))]
    [Migration("20260618160500_AddReturnOrderStatuses")]
    public partial class AddReturnOrderStatuses : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.check_constraints
                    WHERE [name] = N'CK_bills_order_status'
                      AND [parent_object_id] = OBJECT_ID(N'[orders].[bills]')
                )
                    ALTER TABLE [orders].[bills] DROP CONSTRAINT [CK_bills_order_status];

                ALTER TABLE [orders].[bills] WITH CHECK ADD CONSTRAINT [CK_bills_order_status]
                CHECK ([order_status] IN (
                    'pending',
                    'confirmed',
                    'shipping',
                    'delivered',
                    'cancelled',
                    'return_requested',
                    'returned',
                    'refunded',
                    'return_rejected'
                ));

                ALTER TABLE [orders].[bills] CHECK CONSTRAINT [CK_bills_order_status];
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.check_constraints
                    WHERE [name] = N'CK_bills_order_status'
                      AND [parent_object_id] = OBJECT_ID(N'[orders].[bills]')
                )
                    ALTER TABLE [orders].[bills] DROP CONSTRAINT [CK_bills_order_status];

                ALTER TABLE [orders].[bills] WITH CHECK ADD CONSTRAINT [CK_bills_order_status]
                CHECK ([order_status] IN (
                    'pending',
                    'confirmed',
                    'shipping',
                    'delivered',
                    'cancelled'
                ));

                ALTER TABLE [orders].[bills] CHECK CONSTRAINT [CK_bills_order_status];
                """);
        }
    }
}
