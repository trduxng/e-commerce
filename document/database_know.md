Viewed SQLServerDbContext.cs:1-430

Cơ sở dữ liệu của dự án **BaseCore** được xây dựng trên **SQL Server**, quản lý thông qua **Entity Framework Core 8 (Code-First)**.

Để tối ưu hóa cấu trúc và dễ dàng quản lý, các bảng dữ liệu được phân chia vào **4 Schema** nghiệp vụ rõ rệt: `auth` (Xác thực), `catalog` (Catalog sản phẩm), `orders` (Giỏ hàng & Đơn hàng), và `sales` (Bán hàng & Khuyến mãi).

Dưới đây là chi tiết cấu trúc từng bảng và quan hệ giữa các thực thể:

---

## 🔑 1. Schema `auth` (Xác thực & Người dùng)

Quản lý thông tin tài khoản, thông tin cá nhân và địa chỉ giao hàng của người dùng.

### Bảng `users` (Ánh xạ từ Entity `User`)

- **Mục đích:** Lưu thông tin tài khoản đăng nhập và phân quyền.
- **Các trường chính:**
  - `id` (Int, Khóa chính tăng tự động)
  - `email` (NVarChar(255), Bắt buộc, Unique Index - không cho phép trùng)
  - `password_hash` (NVarChar(500), Bắt buộc - dùng lưu mật khẩu)
  - `full_name` (NVarChar(100), Bắt buộc)
  - `role` (NVarChar(20), ví dụ: `admin`, `customer`)
  - `status` (NVarChar(20), ví dụ: `active`, `suspended`)
  - `created_at`, `updated_at` (Lưu vết thời gian tạo/sửa)

### Bảng `user_addresses` (Ánh xạ từ Entity `UserAddress`)

- **Mục đích:** Quản lý số địa chỉ giao hàng của từng khách hàng.
- **Quan hệ:** **N - 1** với bảng `users` (Khóa ngoại `user_id` liên kết với `users.id`, cấu hình `DeleteBehavior.Cascade` - khi xóa User thì xóa sạch địa chỉ liên quan).
- **Các trường chính:** `receiver_name`, `phone`, `province` (tỉnh/thành), `district` (quận/huyện), `ward` (phường/xã), `address_detail` (địa chỉ chi tiết), `is_default` (địa chỉ mặc định).

---

## 📦 2. Schema `catalog` (Danh mục, Sản phẩm & Thuộc tính)

Quản lý sản phẩm và các thuộc tính đi kèm để hiển thị lên trang Shop.

### Bảng `product_types` (Danh mục - Ánh xạ từ Entity `Category`)

- **Mục đích:** Phân loại sản phẩm.
- **Quan hệ tự tham chiếu (Self-Reference):** Khóa ngoại `parent_id` liên kết ngược lại `product_types.id` để tạo cây danh mục cha-con đa cấp (ví dụ: Điện thoại -> iPhone).

### Bảng `products` (Sản phẩm - Ánh xạ từ Entity `Product`)

- **Mục đích:** Lưu thông tin chung của sản phẩm (chưa chia theo phiên bản).
- **Quan hệ:**
  - **N - 1** với `product_types` (khóa ngoại `product_type_id`).
  - **N - 1** với `manufacturers` (khóa ngoại `manufacturer_id`, SetNull khi xóa hãng).
- **Các trường chính:** `name`, `slug` (Unique Index dùng làm đường dẫn đẹp cho SEO), `base_price` (Giá sàn), `thumbnail_url` (ảnh đại diện), `sold_count`, `view_count`, `is_featured` (Sản phẩm nổi bật).

### Bảng `product_variants` (Biến thể sản phẩm - Ánh xạ từ Entity `ProductVariant`)

- **Mục đích:** Lưu thông tin chi tiết từng phiên bản sản phẩm (theo Size, Màu sắc).
- **Quan hệ:** **N - 1** với `products` (Khóa ngoại `product_id`, Cascade Delete khi xóa sản phẩm cha).
- **Các trường chính:** `size`, `color`, `sku` (Unique Index - Mã định danh kho hàng), `price` (Giá gốc phiên bản), `sale_price` (Giá khuyến mãi), `stock_quantity` (Số lượng tồn kho).

### Bảng `product_specifications` (Thuộc tính kỹ thuật - Ánh xạ từ Entity `ProductSpecification`)

- **Mục đích:** Lưu thông số kỹ thuật cấu hình sản phẩm (ví dụ: RAM 8GB, Pin 5000mAh).
- **Quan hệ:** Là bảng trung gian liên kết **N - N** giữa `products` và `specification_attributes` (Thuộc tính chung).

### Bảng `favorite_products` (Yêu thích - Ánh xạ từ Entity `FavoriteProduct`)

- **Mục đích:** Lưu danh sách Wishlist của khách hàng.
- **Quan hệ:** Bảng trung gian liên kết **N - N** giữa `users` và `products` (Unique index trên cặp `user_id` và `product_id` để tránh một người thích trùng 1 sản phẩm nhiều lần).

### Bảng `product_reviews` (Đánh giá - Ánh xạ từ Entity `Review`)

- **Mục đích:** Lưu đánh giá và số sao của khách hàng.
- **Quan hệ:** Liên kết với `users`, `products` và `bill_details` (hóa đơn mua hàng).
- **Check Constraint:** `CK_product_reviews_rating` quy định trường `rating` bắt buộc phải nằm trong khoảng từ `1` đến `5`.

---

## 🛒 3. Schema `orders` (Giỏ hàng & Đơn hàng)

Quản lý quá trình chọn mua hàng và thanh toán.

### Bảng `carts` & `cart_items` (Giỏ hàng & Chi tiết giỏ hàng)

- **Mục đích:** Lưu các sản phẩm khách hàng đã chọn nhưng chưa thanh toán.
- **Cấu trúc `cart_items` đặc biệt:** Ngoài liên kết khóa ngoại với biến thể sản phẩm (`product_variant_id`), bảng này lưu thêm các trường snapshot như `price_snapshot`, `product_name_snapshot`, `sku_snapshot` để tránh việc gọi JOIN quá nhiều bảng khi hiển thị giỏ hàng nhanh.

### Bảng `bills` (Đơn hàng - Ánh xạ từ Entity `Order`)

- **Mục đích:** Lưu trữ thông tin hóa đơn đặt hàng.
- **Các trường chính:**
  - `order_code` (Mã đơn hàng, ví dụ: `ORD-5892`, Unique Index để tra cứu nhanh).
  - `shipping_address_full` (Địa chỉ giao hàng hoàn chỉnh được nối chuỗi để lưu cố định).
  - `subtotal`, `shipping_fee`, `discount_amount`, `tax_amount`, `total_amount` (Tổng tiền).
  - `payment_method` (VNPAY, COD, PayPal,...), `payment_status` (Pending, Paid, Failed).
  - `order_status` (Trạng thái đơn hàng).
- **Check Constraint (`CK_bills_order_status`):** Ràng buộc trường `order_status` chỉ được phép nhận các giá trị: `'pending'`, `'confirmed'`, `'shipping'`, `'delivered'`, `'cancelled'`, `'return_requested'`, `'returned'`, `'refunded'`, `'return_rejected'`.

### Bảng `bill_details` (Chi tiết đơn hàng - Ánh xạ từ Entity `OrderDetail`)

- **Mục đích:** Lưu chi tiết các sản phẩm được mua trong đơn hàng đó.
- **Áp dụng "Snapshot Pattern":** Bắt buộc phải lưu trữ thông tin sản phẩm tại thời điểm mua (`product_name_snapshot`, `size_snapshot`, `color_snapshot`, `sku_snapshot`, `unit_price`). Nếu sau này Admin có đổi tên sản phẩm hay đổi giá ở Catalog, thông tin trên hóa đơn cũ vẫn được giữ nguyên vẹn để đối soát tài chính.

---

## 🏷️ 4. Schema `sales` (Khuyến mãi & Thuộc tính đặt hàng)

Quản lý các thuộc tính khi đặt hàng và mã giảm giá.

### Bảng `coupons` (Mã giảm giá - Ánh xạ từ Entity `Coupon`)

- **Mục đích:** Quản lý chiến dịch khuyến mãi bằng mã giảm giá.
- **Các trường chính:** `code` (Unique Index), `type` (Phần trăm hoặc Số tiền cố định), `value` (Mức giảm), `min_order_value` (Giá trị đơn tối thiểu áp dụng), `usage_limit` (Giới hạn lượt dùng), `used_count` (Số lượt đã dùng), `start_date`, `end_date`, `is_active`.

### Bảng `checkout_attributes` & `checkout_attribute_values`

- **Mục đích:** Quản lý các tùy chọn phụ khi thanh toán (ví dụ: "Gói quà", "Ghi chú đặc biệt" với các mức phụ phí tương ứng được lưu trong trường `price_adjustment`).

---

## 💡 ĐIỂM CỘNG KHI THI VẤN ĐÁP VỀ DATABASE

Nếu thầy cô hỏi về thiết kế Database, hãy nhấn mạnh 3 điểm thiết kế chuẩn công nghiệp sau của dự án:

1.  **Sử dụng Schema (`auth`, `catalog`, `orders`, `sales`):** Giúp gom nhóm các bảng có cùng nghiệp vụ lại với nhau, tránh tình trạng hàng chục bảng nằm lộn xộn trong database mặc định (`dbo`).
2.  **Snapshot Pattern (Lưu ảnh chụp dữ liệu):** Trong bảng `bill_details`, ta không chỉ lưu `product_variant_id` mà lưu toàn bộ thông tin tên sản phẩm, giá bán, SKU tại thời điểm mua. Điều này giúp lịch sử hóa đơn không bao giờ bị sai lệch khi giá sản phẩm thay đổi.
3.  **Ràng buộc chặt chẽ (Constraints & Indexes):** Sử dụng các `CheckConstraint` để khống chế giá trị hợp lệ (như số sao đánh giá chỉ từ 1 đến 5, trạng thái đơn hàng chỉ được nhận các giá trị cố định) và `Unique Index` (trên email của User, SKU sản phẩm, Code đơn hàng) để bảo vệ tính toàn vẹn dữ liệu từ tầng database.
