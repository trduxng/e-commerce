File **`ecommerce_ddl.sql`** (1.083 dòng) đã sẵn sàng để tải về. Dưới đây là tổng quan những gì được tạo ra:

***

## Tổng Quan File DDL

### 📐 Cấu trúc (32 bảng / 7 schema)
| Schema | Bảng | Vai trò |
|---|---|---|
| `auth` | users, user_addresses, admin_logs, password_reset_tokens | Người dùng & bảo mật |
| `catalog` | product_types, suppliers, collections, products, product_variants, product_images, product_attributes, tags, product_tags | Sản phẩm |
| `orders` | carts, cart_items, bills, bill_details, order_status_logs | Đơn hàng |
| `reviews` | reviews, review_images, review_replies | Nhận xét |
| `promotions` | coupons, coupon_usages, flash_sales, flash_sale_items | Khuyến mãi |
| `payment` | payment_transactions, shipments | Thanh toán & vận chuyển |
| `operations` | wishlists, notifications, banners, settings, inventory_transactions | Vận hành |

***

### ⚡ Triggers (5 cái)
- `TR_users_updated_at` — tự cập nhật `updated_at` cho users
- `TR_products_updated_at` — tự cập nhật `updated_at` cho products
- `TR_bills_updated_at` — tự cập nhật `updated_at` cho bills
- `TR_product_variants_stock_log` — **tự ghi `inventory_transactions`** khi tồn kho thay đổi
- `TR_carts_updated_at_on_item_change` — cập nhật cart khi thêm/xóa item

***

### 🔧 Stored Procedures (4 cái)
- `orders.sp_PlaceOrder` — đặt hàng, trừ tồn kho, tạo bill **trong 1 transaction**
- `orders.sp_CancelOrder` — huỷ đơn, **hoàn tồn kho** tự động
- `reviews.sp_ModerateReview` — duyệt/từ chối review + ghi audit log
- `operations.sp_RevenueReport` — báo cáo doanh thu theo khoảng thời gian

***

### 👁️ Views (4 cái)
- `catalog.vw_products_summary` — sản phẩm kèm rating trung bình, tồn kho, giá min/max
- `orders.vw_bills_detail` — đơn hàng đầy đủ thông tin khách + vận chuyển
- `operations.vw_top_selling_products` — top 100 sản phẩm bán chạy nhất
- `operations.vw_low_stock_variants` — **cảnh báo tồn kho ≤ 5**

***

### 🚀 Cách Chạy

1. Mở **SQL Server Management Studio (SSMS)**
2. Mở file `ecommerce_ddl.sql`
3. Nhấn **F5** hoặc **Execute**
4. Kiểm tra output cuối: `✅ ECommerceDB DDL hoàn tất`