using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Repository.Migrations.SQLServerDb
{
    /// <inheritdoc />
    public partial class AddCustomerColumnsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Company",
                schema: "auth",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                schema: "auth",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                schema: "auth",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                schema: "auth",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                schema: "auth",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZipPostalCode",
                schema: "auth",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Company",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "FirstName",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LastName",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ZipPostalCode",
                schema: "auth",
                table: "users");
        }
    }
}
