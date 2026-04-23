Bạn là Senior Database Architect chuyên về SQL Server (T-SQL).
Nhiệm vụ: Thiết kế schema và viết toàn bộ DDL cho hệ thống
thương mại điện tử dưới đây.

═══════════════════════════════════════
YÊU CẦU KỸ THUẬT
═══════════════════════════════════════
- Hệ quản trị: Microsoft SQL Server (T-SQL)
- Chuẩn hóa: 3NF
- Kiểu khóa chính: INT IDENTITY(1,1) hoặc BIGINT IDENTITY(1,1)
- Timestamp: DATETIME2 DEFAULT GETDATE()
- Tiền tệ: DECIMAL(15,2)
- Soft delete: cột deleted_at DATETIME2 NULL (các bảng quan trọng)
- Enum: dùng CHECK constraint thay vì kiểu ENUM
- Tổ chức theo schema: auth, catalog, orders, promotions,
  payment, operations
- Snapshot dữ liệu trong bill_details và bills (bắt buộc)
- Tạo bảng theo thứ tự FK dependency (bảng không có FK trước)
- Cuối mỗi bảng: thêm INDEX quan trọng (email, slug, order_code…)

═══════════════════════════════════════
CẤU TRÚC DATABASE (32 BẢNG)
═══════════════════════════════════════

── NHÓM 1: auth ─────────────────────
[1] users
  id, email (UNIQUE), password_hash, phone, full_name, avatar_url
  role CHECK IN ('customer','staff','admin')
  status CHECK IN ('active','banned','unverified')
  email_verified_at, created_at, updated_at, last_login_at
  deleted_at (soft delete)

[2] user_addresses
  id, user_id (FK→users), receiver_name, phone
  province, district, ward, address_detail
  is_default BIT DEFAULT 0

[3] admin_logs
  id, admin_id (FK→users), action, target_table, target_id
  old_value NVARCHAR(MAX) -- JSON
  new_value NVARCHAR(MAX) -- JSON
  ip_address, user_agent, created_at

[4] password_reset_tokens
  id, user_id (FK→users), token_hash
  expires_at, used_at

── NHÓM 2: catalog ──────────────────
[5] product_types
  id, name, slug (UNIQUE), description
  parent_id (FK→product_types, self-reference, NULL)
  image_url, is_active BIT, sort_order INT DEFAULT 0

[6] suppliers
  id, name, email, phone, address, country
  status CHECK IN ('active','inactive')
  created_at

[7] collections
  id, name, slug (UNIQUE), description, banner_url
  start_date DATE, end_date DATE, is_active BIT

[8] products
  id, name, slug (UNIQUE), product_type_id (FK), collection_id (FK NULL),
  supplier_id (FK NULL), description NVARCHAR(MAX),
  short_description NVARCHAR(500), base_price, thumbnail_url
  is_active BIT, is_featured BIT DEFAULT 0
  sold_count INT DEFAULT 0, view_count INT DEFAULT 0
  deleted_at, created_at, updated_at

[9] product_variants
  id, product_id (FK→products), size NVARCHAR(20), color NVARCHAR(50)
  sku NVARCHAR(120) UNIQUE, price, sale_price NULL
  stock_quantity INT DEFAULT 0, weight_gram INT NULL
  image_url, is_active BIT DEFAULT 1

[10] product_images
  id, product_id (FK), image_url, alt_text, sort_order, is_primary BIT

[11] product_attributes
  id, product_id (FK), attribute_name NVARCHAR(100),
  attribute_value NVARCHAR(255)

[12] tags
  id, name NVARCHAR(100), slug NVARCHAR(100) UNIQUE

[13] product_tags
  product_id (FK→products), tag_id (FK→tags)
  PRIMARY KEY (product_id, tag_id)

── NHÓM 3: orders ───────────────────
[14] carts
  id, user_id (FK NULL), session_token NVARCHAR(255) UNIQUE
  created_at, updated_at

[15] cart_items
  id, cart_id (FK→carts), product_variant_id (FK→product_variants)
  quantity INT, price_snapshot DECIMAL(15,2)

[16] bills
  id, order_code NVARCHAR(30) UNIQUE -- format: ORD-YYYY-NNNNN
  user_id (FK NULL), guest_email NVARCHAR(255) NULL
  receiver_name, receiver_phone, shipping_address_full NVARCHAR(MAX)
  subtotal, shipping_fee DEFAULT 0, discount_amount DEFAULT 0
  tax_amount DEFAULT 0, total_amount
  payment_method CHECK IN ('cod','vnpay','momo','bank_transfer')
  payment_status CHECK IN ('pending','paid','refunded')
  order_status CHECK IN ('pending','confirmed','shipping',
                         'delivered','cancelled')
  coupon_code NULL, note NULL, cancelled_reason NULL
  created_at, updated_at

[17] bill_details
  id, bill_id (FK→bills), product_variant_id (FK→product_variants)
  product_name_snapshot NVARCHAR(255)
  size_snapshot NVARCHAR(20), color_snapshot NVARCHAR(50)
  sku_snapshot NVARCHAR(120)
  quantity INT, unit_price DECIMAL(15,2), total_price DECIMAL(15,2)

[18] order_status_logs
  id, bill_id (FK), from_status NVARCHAR(50),
  to_status NVARCHAR(50), note NULL
  created_by (FK→users), created_at

── NHÓM 4: reviews ──────────────────
[19] reviews
  id, user_id (FK), product_id (FK), bill_detail_id (FK)
  rating TINYINT CHECK (rating BETWEEN 1 AND 5)
  title NVARCHAR(255) NULL, content NVARCHAR(MAX) NULL
  is_verified_purchase BIT DEFAULT 1
  helpful_count INT DEFAULT 0
  status CHECK IN ('pending','approved','rejected')
  created_at
  UNIQUE CONSTRAINT: (user_id, bill_detail_id)

[20] review_images
  id, review_id (FK), image_url, sort_order INT DEFAULT 0

[21] review_replies
  id, review_id (FK), admin_id (FK→users), content, created_at

── NHÓM 5: promotions ───────────────
[22] coupons
  id, code NVARCHAR(50) UNIQUE
  type CHECK IN ('percent','fixed','free_ship')
  value DECIMAL(10,2), min_order_value DECIMAL(15,2) DEFAULT 0
  max_discount_amount DECIMAL(15,2) NULL
  usage_limit INT NULL, used_count INT DEFAULT 0
  start_date DATETIME2, end_date DATETIME2, is_active BIT

[23] coupon_usages
  id, coupon_id (FK), user_id (FK), bill_id (FK)
  discount_applied DECIMAL(15,2), used_at DATETIME2

[24] flash_sales
  id, name NVARCHAR(150), start_time DATETIME2,
  end_time DATETIME2, is_active BIT

[25] flash_sale_items
  id, flash_sale_id (FK), product_variant_id (FK)
  sale_price DECIMAL(15,2)
  quantity_limit INT NULL, sold_count INT DEFAULT 0

── NHÓM 6: payment ──────────────────
[26] payment_transactions
  id, bill_id (FK), gateway NVARCHAR(50)
  transaction_code NVARCHAR(255), amount DECIMAL(15,2)
  status CHECK IN ('pending','success','failed','refunded')
  gateway_response NVARCHAR(MAX) -- JSON
  paid_at DATETIME2 NULL, created_at DATETIME2

[27] shipments
  id, bill_id (FK), carrier NVARCHAR(50)
  tracking_code NVARCHAR(100) NULL
  status NVARCHAR(50), estimated_delivery DATE NULL
  carrier_fee DECIMAL(15,2) NULL
  shipped_at DATETIME2 NULL, delivered_at DATETIME2 NULL

── NHÓM 7: operations ───────────────
[28] wishlists
  id, user_id (FK), product_id (FK), created_at
  UNIQUE CONSTRAINT: (user_id, product_id)

[29] notifications
  id, user_id (FK), type NVARCHAR(50), title NVARCHAR(255)
  message NVARCHAR(MAX), is_read BIT DEFAULT 0
  link NVARCHAR(500) NULL, created_at DATETIME2

[30] banners
  id, image_url, link_url NULL, title NVARCHAR(255) NULL
  position NVARCHAR(50), is_active BIT, sort_order INT DEFAULT 0

[31] settings
  key NVARCHAR(100) UNIQUE, value NVARCHAR(MAX)
  description NVARCHAR(500) NULL
  group_name NVARCHAR(50) NULL -- 'general','payment','shipping'

[32] inventory_transactions
  id, product_variant_id (FK→product_variants)
  type CHECK IN ('import','export','adjustment','return')
  quantity_change INT -- dương = nhập, âm = xuất
  stock_before INT, stock_after INT
  reference_id BIGINT NULL -- bill_id hoặc phiếu nhập
  note NVARCHAR(500) NULL
  created_by (FK→users), created_at DATETIME2

═══════════════════════════════════════
YÊU CẦU OUTPUT
═══════════════════════════════════════
1. Tạo DATABASE và USE statement
2. Tạo 7 SCHEMA riêng biệt
3. Viết CREATE TABLE theo đúng thứ tự FK dependency
4. Mỗi bảng có:
   - Comment mô tả mục đích bảng
   - PRIMARY KEY constraint đặt tên rõ ràng (PK_tablename)
   - FOREIGN KEY constraint đặt tên (FK_table_ref)
   - CHECK constraint đặt tên (CK_table_column)
   - DEFAULT values đầy đủ
5. Sau tất cả CREATE TABLE, viết phần INDEX:
   - Unique index cho: email, slug, sku, order_code, code (coupon)
   - Non-clustered index cho: các cột FK thường JOIN
   - Composite index cho: (user_id, status) trong bills,
     (product_id, status) trong reviews
6. KHÔNG insert dữ liệu mẫu
7. Toàn bộ tên cột, bảng dùng snake_case
8. Mã phải chạy được ngay, không lỗi dependency

Bắt đầu viết DDL:
Sau khi hoàn thành DDL, viết thêm vài stored procedure, trigger, view