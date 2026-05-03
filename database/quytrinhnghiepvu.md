Dưới đây là toàn bộ quy trình nghiệp vụ và nhiệm vụ của hệ thống thương mại điện tử đang thiết kế, tổ chức theo từng tác nhân và luồng xử lý.

***

# Quy Trình Nghiệp Vụ Hệ Thống TMĐT

## Tác Nhân Trong Hệ Thống

| Tác nhân | Vai trò | Bảng liên quan |
|---|---|---|
| **Customer** | Mua hàng, đánh giá, quản lý tài khoản | `users`, `bills`, `reviews`, `carts` |
| **Guest** | Xem sản phẩm, đặt hàng không cần đăng nhập | `carts (session_token)`, `bills (user_id=NULL)` |
| **Staff** | Xử lý đơn hàng, cập nhật vận chuyển | `bills`, `shipments`, `order_status_logs` |
| **Admin** | Quản lý toàn hệ thống, duyệt nội dung | Tất cả bảng + `admin_logs` |
| **Hệ thống** | Trigger tự động, cập nhật tồn kho, thông báo | `inventory_transactions`, `notifications` |

***

## 🔐 Nhóm 1: Quản Lý Người Dùng

### 1.1 Đăng ký tài khoản
```
Khách nhập email + mật khẩu
  → Tạo bản ghi users (status = 'unverified')
  → Gửi email xác thực → tạo password_reset_tokens (dùng lại cho verify)
  → Khách click link → cập nhật email_verified_at + status = 'active'
```

### 1.2 Đăng nhập
```
Nhập email + mật khẩu
  → Kiểm tra password_hash (Bcrypt)
  → Cập nhật last_login_at
  → Trả về JWT token
```

### 1.3 Quên mật khẩu
```
Nhập email
  → Tạo bản ghi password_reset_tokens (token_hash, expires_at)
  → Gửi link qua email
  → Khách click → kiểm tra used_at IS NULL và expires_at > NOW()
  → Cập nhật password_hash + đánh dấu used_at
```

### 1.4 Quản lý địa chỉ
```
Thêm/sửa/xoá user_addresses
  → Nếu is_default = 1: tự động set các địa chỉ khác = 0
  → Tối đa địa chỉ/user: tuỳ business rule (VD: 5 địa chỉ)
```

***

## 📦 Nhóm 2: Quản Lý Sản Phẩm (Admin)

### 2.1 Thêm sản phẩm mới
```
Admin tạo products (is_active = 0 — nháp)
  → Thêm product_variants (size, color, sku, price, stock)
  → Upload product_images (đặt is_primary cho ảnh chính)
  → Thêm product_attributes (chất liệu, xuất xứ...)
  → Gắn tags qua product_tags
  → Chuyển is_active = 1 → sản phẩm hiển thị
  → Ghi admin_logs
```

### 2.2 Cập nhật tồn kho
```
Admin nhập hàng từ suppliers
  → Cập nhật stock_quantity trong product_variants
  → Trigger TR_product_variants_stock_log tự động ghi inventory_transactions
    (type='import', stock_before, stock_after, quantity_change > 0)
```

### 2.3 Quản lý danh mục
```
product_types hỗ trợ cấu trúc cây (parent_id self-reference):
  Thời trang (parent=NULL)
    └── Áo (parent=1)
          └── Áo polo (parent=2)
    └── Quần (parent=1)
```

***

## 🛒 Nhóm 3: Mua Hàng (Luồng Chính)

### 3.1 Duyệt & Tìm kiếm sản phẩm
```
Khách truy cập → xem products (is_active=1, deleted_at IS NULL)
  → Lọc theo product_types, collections, tags, price range
  → Tăng view_count trong products
  → Xem chi tiết: hiển thị product_variants (size/màu còn hàng)
  → Thêm vào wishlists (nếu đã đăng nhập)
```

### 3.2 Giỏ hàng
```
Chưa đăng nhập: tạo carts với session_token
Đã đăng nhập:   tạo carts với user_id
  → Thêm sản phẩm → cart_items (product_variant_id, quantity, price_snapshot)
  → price_snapshot lưu giá TẠI THỜI ĐIỂM thêm vào giỏ
  → Merge giỏ guest → giỏ user khi đăng nhập
```

### 3.3 Đặt hàng — `sp_PlaceOrder` (1 transaction)
```
Khách xác nhận giỏ hàng
  ① Kiểm tra stock_quantity >= quantity cho từng variant
  ② Áp dụng coupon (nếu có):
       → Kiểm tra coupon: is_active, trong hạn, usage_limit
       → Tính discount_amount theo type (percent/fixed/free_ship)
       → Tăng used_count trong coupons
       → Ghi coupon_usages
  ③ Tạo bills với order_code = 'ORD-YYYY-NNNNN'
  ④ Tạo bill_details với đầy đủ snapshot:
       product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot
  ⑤ Trừ stock_quantity trong product_variants
       → Trigger tự ghi inventory_transactions (type='export')
  ⑥ Tăng sold_count trong products
  ⑦ Ghi order_status_logs (from=NULL, to='pending')
  ⑧ Xoá cart_items
  ⑨ Gửi notifications cho khách
```

### 3.4 Kiểm tra tồn kho (Race Condition)
```
Khi nhiều người mua cùng lúc:
  → Dùng SELECT ... WITH (UPDLOCK) trong sp_PlaceOrder
  → Kiểm tra lại stock sau khi lock
  → Nếu stock < 0: ROLLBACK + trả lỗi "Hết hàng"
```

***

## 💳 Nhóm 4: Thanh Toán

### 4.1 Thanh toán COD
```
bills.payment_method = 'cod'
  → payment_status = 'pending' (chưa thu tiền)
  → Khi giao hàng thành công:
       order_status = 'delivered' → payment_status = 'paid'
```

### 4.2 Thanh toán online (VNPAY / MoMo)
```
Khách chọn cổng thanh toán
  → Tạo payment_transactions (status='pending')
  → Redirect đến cổng thanh toán
  → Cổng gọi webhook callback:
       → Lưu gateway_response (JSON đầy đủ để đối soát)
       → Cập nhật status = 'success' / 'failed'
       → Nếu success: bills.payment_status = 'paid'
       → Ghi paid_at
```

### 4.3 Hoàn tiền
```
Admin xử lý refund
  → payment_transactions: INSERT bản ghi mới type='refunded'
  → bills.payment_status = 'refunded'
  → Ghi admin_logs
  → Gửi notifications cho khách
```

***

## 🚚 Nhóm 5: Vận Chuyển & Giao Hàng

### 5.1 Luồng trạng thái đơn hàng
```
pending → confirmed → shipping → delivered
           ↓                      ↓
        cancelled              (hoàn thành)
```

### 5.2 Xử lý vận chuyển (Staff)
```
order_status = 'confirmed'
  → Staff tạo shipments: carrier, tracking_code
  → Cập nhật order_status = 'shipping'
  → Ghi order_status_logs
  → Gửi notifications kèm tracking_code

Khi giao thành công:
  → shipments.delivered_at = NOW()
  → order_status = 'delivered'
  → payment_status = 'paid' (nếu COD)
```

### 5.3 Huỷ đơn — `sp_CancelOrder`
```
Chỉ được huỷ khi: pending hoặc confirmed
  → order_status = 'cancelled' + lưu cancelled_reason
  → Hoàn stock_quantity về product_variants
     → Trigger ghi inventory_transactions (type='return')
  → Giảm sold_count
  → Ghi order_status_logs
  → Nếu đã thanh toán → xử lý refund
```

***

## 💬 Nhóm 6: Đánh Giá Sản Phẩm

### 6.1 Quy tắc nghiệp vụ quan trọng
```
Chỉ được review KHI:
  - Đã đăng nhập (user_id NOT NULL)
  - Đơn hàng order_status = 'delivered'
  - bill_detail_id hợp lệ (đã mua đúng sản phẩm đó)
  - Chưa review lần nào (UNIQUE constraint user_id + bill_detail_id)
```

### 6.2 Luồng xử lý
```
Khách gửi review (rating 1-5, nội dung, ảnh)
  → reviews.status = 'pending' (chờ duyệt)
  → Admin/Staff duyệt qua sp_ModerateReview:
       approved → hiển thị trên trang SP
       rejected → ẩn, ghi admin_logs
  → Admin có thể reply qua review_replies
  → Gửi notifications cho khách khi review được duyệt
```

***

## 🎁 Nhóm 7: Khuyến Mãi

### 7.1 Coupon
```
Khách nhập mã coupon lúc checkout
  → Kiểm tra: is_active=1, NOW() BETWEEN start_date AND end_date
  → Kiểm tra: used_count < usage_limit (hoặc NULL = không giới hạn)
  → Kiểm tra: subtotal >= min_order_value
  → Tính giảm:
       percent  → discount = subtotal × value/100, tối đa max_discount_amount
       fixed    → discount = value (thẳng)
       free_ship→ shipping_fee = 0
  → Ghi coupon_usages sau khi đặt thành công
```

### 7.2 Flash Sale
```
flash_sales định nghĩa khung giờ
  → flash_sale_items gắn variant + sale_price + quantity_limit
  → Khi khách mua: kiểm tra NOW() trong [start_time, end_time]
  → sold_count < quantity_limit → áp dụng sale_price
  → Tăng sold_count (cần lock để tránh oversell)
```

***

## 📊 Nhóm 8: Vận Hành & Báo Cáo (Admin)

### 8.1 Dashboard quản trị
```
sp_RevenueReport(@date_from, @date_to)
  → Doanh thu theo ngày, tổng đơn, AOV, tổng discount

vw_top_selling_products
  → Top sản phẩm bán chạy theo units_sold và revenue

vw_low_stock_variants
  → Cảnh báo tồn kho ≤ 5 → admin nhập hàng kịp thời
```

### 8.2 Audit Trail
```
Mọi hành động của admin → admin_logs (old_value/new_value JSON)
Mọi thay đổi tồn kho → inventory_transactions
Mọi thay đổi trạng thái đơn → order_status_logs
→ Truy vết được: Ai làm gì? Lúc nào? Trước/sau như thế nào?
```

### 8.3 Cấu hình hệ thống
```
settings (key-value) — thay đổi không cần deploy lại:
  'site_name'          → Tên website
  'free_ship_threshold'→ Miễn ship đơn từ X đồng
  'maintenance_mode'   → Bật/tắt bảo trì
  'max_review_images'  → Giới hạn ảnh/review
```

***

## Sơ Đồ Luồng Tổng Thể

```
[GUEST/CUSTOMER]
      │
      ├─ Đăng ký / Đăng nhập ──────────────────→ auth.users
      │
      ├─ Duyệt sản phẩm ────────────────────────→ catalog.*
      │         └─ Thêm yêu thích ──────────────→ operations.wishlists
      │
      ├─ Thêm giỏ hàng ─────────────────────────→ orders.carts / cart_items
      │
      ├─ Đặt hàng (sp_PlaceOrder) ─────────────→ orders.bills + bill_details
      │         ├─ Áp coupon ──────────────────→ promotions.coupon_usages
      │         └─ Trừ tồn kho ───────────────→ catalog.product_variants
      │                   └─ [Trigger] ─────────→ operations.inventory_transactions
      │
      ├─ Thanh toán ────────────────────────────→ payment.payment_transactions
      │
      ├─ Nhận hàng ─────────────────────────────→ payment.shipments
      │
      └─ Đánh giá ──────────────────────────────→ reviews.reviews

[STAFF / ADMIN]
      ├─ Xác nhận & xử lý đơn ─────────────────→ orders.order_status_logs
      ├─ Quản lý sản phẩm/kho ─────────────────→ catalog.* + operations.inventory_transactions
      ├─ Duyệt review ─────────────────────────→ reviews.reviews (sp_ModerateReview)
      └─ Mọi hành động ────────────────────────→ auth.admin_logs
```