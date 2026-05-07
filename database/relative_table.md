Dưới đây là bản thiết kế CSDL **tinh chỉnh và hoàn chỉnh** dựa trên yêu cầu của bạn, bổ sung thêm các điểm còn thiếu và làm rõ lý do thiết kế từng bảng.

***

# 👤 NHÓM 1: Người Dùng & Phân Quyền

### `users`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BIGINT / UUID | PK | UUID v4 nếu cần bảo mật |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | TEXT | NOT NULL | Bcrypt / Argon2 |
| `phone` | VARCHAR(20) | UNIQUE, Nullable | |
| `full_name` | VARCHAR(100) | NOT NULL | |
| `avatar_url` | TEXT | Nullable | |
| `role` | ENUM(`customer`,`staff`,`admin`) | DEFAULT `customer` | |
| `status` | ENUM(`active`,`banned`,`unverified`) | DEFAULT `unverified` | |
| `email_verified_at` | TIMESTAMP | Nullable | ✅ **Bổ sung** — xác thực email |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | | |
| `last_login_at` | TIMESTAMP | Nullable | |

> ✅ **Bổ sung `email_verified_at`**: Tách biệt trạng thái xác minh email với `status`, giúp flow "đăng ký → xác thực → active" rõ ràng hơn.

***

### `user_addresses`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BIGINT | PK | |
| `user_id` | BIGINT | FK → users, NOT NULL | |
| `receiver_name` | VARCHAR(100) | NOT NULL | |
| `phone` | VARCHAR(20) | NOT NULL | |
| `province` | VARCHAR(100) | NOT NULL | |
| `district` | VARCHAR(100) | NOT NULL | |
| `ward` | VARCHAR(100) | NOT NULL | |
| `address_detail` | TEXT | NOT NULL | Số nhà, tên đường |
| `is_default` | BOOLEAN | DEFAULT FALSE | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

***

### `admin_logs`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BIGINT | PK | |
| `admin_id` | BIGINT | FK → users | |
| `action` | VARCHAR(100) | NOT NULL | `BAN_USER`, `DELETE_PRODUCT`… |
| `target_table` | VARCHAR(50) | NOT NULL | |
| `target_id` | BIGINT | NOT NULL | |
| `old_value` | JSON | Nullable | Trạng thái trước |
| `new_value` | JSON | Nullable | Trạng thái sau |
| `ip_address` | VARCHAR(45) | | IPv4 + IPv6 |
| `user_agent` | TEXT | Nullable | ✅ **Bổ sung** — trình duyệt/thiết bị |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

***

### ✅ `password_reset_tokens` *(Bổ sung)*
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `user_id` | BIGINT | FK → users |
| `token_hash` | VARCHAR(255) | Hash của token gửi qua email |
| `expires_at` | TIMESTAMP | |
| `used_at` | TIMESTAMP | Nullable — token chỉ dùng 1 lần |

> Phục vụ chức năng "Quên mật khẩu" — cần thiết cho mọi hệ thống production.

***

# 📦 NHÓM 2: Sản Phẩm

### `product_types`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | INT | PK | |
| `name` | VARCHAR(100) | NOT NULL | |
| `slug` | VARCHAR(100) | UNIQUE | |
| `description` | TEXT | Nullable | |
| `parent_id` | INT | FK → product_types, Nullable | Self-reference danh mục cha/con |
| `image_url` | TEXT | Nullable | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `sort_order` | INT | DEFAULT 0 | |

***

### `suppliers`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | INT | PK | |
| `name` | VARCHAR(150) | NOT NULL | |
| `email` | VARCHAR(150) | Nullable | |
| `phone` | VARCHAR(20) | Nullable | |
| `address` | TEXT | Nullable | |
| `country` | VARCHAR(100) | DEFAULT `Vietnam` | |
| `status` | ENUM(`active`,`inactive`) | DEFAULT `active` | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

***

### `collections`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | INT | PK | |
| `name` | VARCHAR(150) | NOT NULL | |
| `slug` | VARCHAR(150) | UNIQUE | |
| `description` | TEXT | Nullable | |
| `banner_url` | TEXT | Nullable | |
| `start_date` | DATE | Nullable | |
| `end_date` | DATE | Nullable | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |

***

### `products`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BIGINT | PK | |
| `name` | VARCHAR(255) | NOT NULL | |
| `slug` | VARCHAR(255) | UNIQUE | URL SEO |
| `product_type_id` | INT | FK → product_types | |
| `collection_id` | INT | FK → collections, Nullable | |
| `supplier_id` | INT | FK → suppliers, Nullable | |
| `description` | TEXT | Nullable | Mô tả dài |
| `short_description` | VARCHAR(500) | Nullable | Mô tả ngắn cho card |
| `base_price` | DECIMAL(15,2) | NOT NULL | Giá tham chiếu |
| `thumbnail_url` | TEXT | Nullable | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `is_featured` | BOOLEAN | DEFAULT FALSE | |
| `sold_count` | INT | DEFAULT 0 | ✅ **Bổ sung** — đếm tổng đã bán |
| `view_count` | INT | DEFAULT 0 | ✅ **Bổ sung** — lượt xem |
| `deleted_at` | TIMESTAMP | Nullable | ✅ **Bổ sung** — soft delete |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | | |

***

### `product_variants`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BIGINT | PK | |
| `product_id` | BIGINT | FK → products | |
| `size` | VARCHAR(20) | Nullable | S/M/L/XL hoặc 38/39/40 |
| `color` | VARCHAR(50) | Nullable | |
| `sku` | VARCHAR(120) | UNIQUE | Mã kho duy nhất |
| `price` | DECIMAL(15,2) | NOT NULL | Giá gốc biến thể |
| `sale_price` | DECIMAL(15,2) | Nullable | Giá khuyến mãi |
| `stock_quantity` | INT | DEFAULT 0 | |
| `weight_gram` | INT | Nullable | Tính phí ship |
| `image_url` | TEXT | Nullable | Ảnh riêng theo màu |
| `is_active` | BOOLEAN | DEFAULT TRUE | |

***

### `product_images`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `product_id` | BIGINT | FK → products |
| `image_url` | TEXT | NOT NULL |
| `alt_text` | VARCHAR(255) | SEO |
| `sort_order` | INT | DEFAULT 0 |
| `is_primary` | BOOLEAN | DEFAULT FALSE |

***

### `product_attributes`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `product_id` | BIGINT | FK → products |
| `attribute_name` | VARCHAR(100) | "Chất liệu", "Xuất xứ"… |
| `attribute_value` | VARCHAR(255) | "Cotton", "Việt Nam"… |

***

### ✅ `product_tags` + `tags` *(Bổ sung)*

**`tags`**: `id`, `name`, `slug`

**`product_tags`**: `product_id` (FK), `tag_id` (FK) — quan hệ nhiều-nhiều

> Cho phép gắn nhãn linh hoạt: "new", "hot", "sale", "eco" mà không phụ thuộc vào cấu trúc danh mục.

***

# 🛒 NHÓM 3: Giỏ Hàng & Đơn Hàng

### `carts`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `user_id` | BIGINT | FK → users, Nullable (guest) |
| `session_token` | VARCHAR(255) | UNIQUE — nhận diện guest |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

***

### `cart_items`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `cart_id` | BIGINT | FK → carts |
| `product_variant_id` | BIGINT | FK → product_variants |
| `quantity` | INT | NOT NULL, >= 1 |
| `price_snapshot` | DECIMAL(15,2) | Giá lúc thêm vào giỏ |

***

### `bills`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `order_code` | VARCHAR(30) | UNIQUE — `ORD-2025-00001` |
| `user_id` | BIGINT | FK → users, Nullable (guest) |
| `guest_email` | VARCHAR(255) | Nullable — đơn của khách vãng lai |
| `receiver_name` | VARCHAR(100) | Snapshot |
| `receiver_phone` | VARCHAR(20) | Snapshot |
| `shipping_address_full` | TEXT | Snapshot địa chỉ đầy đủ |
| `subtotal` | DECIMAL(15,2) | Tổng tiền hàng |
| `shipping_fee` | DECIMAL(15,2) | DEFAULT 0 |
| `discount_amount` | DECIMAL(15,2) | DEFAULT 0 |
| `tax_amount` | DECIMAL(15,2) | ✅ **Bổ sung** — VAT |
| `total_amount` | DECIMAL(15,2) | Tổng thanh toán cuối |
| `payment_method` | ENUM(`cod`,`vnpay`,`momo`,`bank_transfer`) | |
| `payment_status` | ENUM(`pending`,`paid`,`refunded`) | |
| `order_status` | ENUM(`pending`,`confirmed`,`shipping`,`delivered`,`cancelled`) | |
| `coupon_code` | VARCHAR(50) | Nullable |
| `note` | TEXT | Nullable |
| `cancelled_reason` | TEXT | ✅ **Bổ sung** — Nullable |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

***

### `bill_details`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `bill_id` | BIGINT | FK → bills |
| `product_variant_id` | BIGINT | FK → product_variants |
| `product_name_snapshot` | VARCHAR(255) | |
| `size_snapshot` | VARCHAR(20) | |
| `color_snapshot` | VARCHAR(50) | ✅ **Bổ sung** |
| `sku_snapshot` | VARCHAR(120) | |
| `quantity` | INT | NOT NULL |
| `unit_price` | DECIMAL(15,2) | |
| `total_price` | DECIMAL(15,2) | `unit_price × quantity` |

***

### `order_status_logs`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `bill_id` | BIGINT | FK → bills |
| `from_status` | VARCHAR(50) | ✅ **Bổ sung** — trạng thái trước |
| `to_status` | VARCHAR(50) | |
| `note` | TEXT | Nullable |
| `created_by` | BIGINT | FK → users |
| `created_at` | TIMESTAMP | |

***

# 💬 NHÓM 4: Đánh Giá & Nhận Xét

### `reviews`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `user_id` | BIGINT | FK → users |
| `product_id` | BIGINT | FK → products |
| `bill_detail_id` | BIGINT | FK → bill_details — **bắt buộc đã mua** |
| `rating` | TINYINT | 1–5, NOT NULL |
| `title` | VARCHAR(255) | Nullable |
| `content` | TEXT | Nullable |
| `is_verified_purchase` | BOOLEAN | DEFAULT TRUE |
| `helpful_count` | INT | ✅ **Bổ sung** — DEFAULT 0 |
| `status` | ENUM(`pending`,`approved`,`rejected`) | DEFAULT `pending` |
| `created_at` | TIMESTAMP | |

### `review_images`
`id`, `review_id` (FK), `image_url`, `sort_order`

### `review_replies`
`id`, `review_id` (FK), `admin_id` (FK → users), `content`, `created_at`

***

# 🎁 NHÓM 5: Khuyến Mãi

### `coupons`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT | PK |
| `code` | VARCHAR(50) | UNIQUE |
| `type` | ENUM(`percent`,`fixed`,`free_ship`) | ✅ **Bổ sung `free_ship`** |
| `value` | DECIMAL(10,2) | |
| `min_order_value` | DECIMAL(15,2) | DEFAULT 0 |
| `max_discount_amount` | DECIMAL(15,2) | Nullable — trần giảm |
| `usage_limit` | INT | Nullable — NULL = không giới hạn |
| `used_count` | INT | DEFAULT 0 |
| `start_date` | DATETIME | |
| `end_date` | DATETIME | |
| `is_active` | BOOLEAN | DEFAULT TRUE |

### `coupon_usages`
`id`, `coupon_id` (FK), `user_id` (FK), `bill_id` (FK), `discount_applied`, `used_at`

### `flash_sales`
`id`, `name`, `start_time`, `end_time`, `is_active`

### `flash_sale_items`
| Cột | Ghi chú |
|---|---|
| `flash_sale_id` | FK → flash_sales |
| `product_variant_id` | FK → product_variants |
| `sale_price` | Giá flash sale |
| `quantity_limit` | Số lượng giới hạn |
| `sold_count` | DEFAULT 0 |

***

# 💳 NHÓM 6: Thanh Toán & Vận Chuyển

### `payment_transactions`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `bill_id` | BIGINT | FK → bills |
| `gateway` | VARCHAR(50) | `vnpay`, `momo`, `zalopay`… |
| `transaction_code` | VARCHAR(255) | Mã từ cổng thanh toán |
| `amount` | DECIMAL(15,2) | |
| `status` | ENUM(`pending`,`success`,`failed`,`refunded`) | |
| `gateway_response` | JSON | Raw response — lưu để đối soát |
| `paid_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | |

### `shipments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT | PK |
| `bill_id` | BIGINT | FK → bills |
| `carrier` | VARCHAR(50) | `GHN`, `GHTK`, `ViettelPost`… |
| `tracking_code` | VARCHAR(100) | Nullable |
| `status` | VARCHAR(50) | `picked_up`, `in_transit`, `delivered`… |
| `estimated_delivery` | DATE | Nullable |
| `carrier_fee` | DECIMAL(15,2) | ✅ **Bổ sung** — phí thực tế từ ĐVVC |
| `shipped_at` | TIMESTAMP | Nullable |
| `delivered_at` | TIMESTAMP | Nullable |

***

# 📊 NHÓM 7: Hỗ Trợ Vận Hành

### `wishlists`
`id`, `user_id` (FK), `product_id` (FK), `created_at`
- **UNIQUE(`user_id`, `product_id`)** — tránh trùng lặp

### `notifications`
`id`, `user_id` (FK), `type` (VARCHAR), `title`, `message`, `is_read` (DEFAULT FALSE), `link`, `created_at`

### `banners`
`id`, `image_url`, `link_url`, `title`, `position`, `is_active`, `sort_order`
- `position`: `home_top`, `sidebar`, `popup`…

### `settings`
| Cột | Ghi chú |
|---|---|
| `key` | UNIQUE — `site_name`, `maintenance_mode`… |
| `value` | TEXT |
| `description` | Giải thích giá trị |
| `group` | ✅ **Bổ sung** — nhóm cài đặt: `general`, `payment`, `shipping` |

***

## ✅ Các Bảng Bổ Sung Đề Xuất Thêm

| Bảng | Chức năng |
|---|---|
| `password_reset_tokens` | Quên mật khẩu an toàn |
| `tags` + `product_tags` | Gắn nhãn linh hoạt cho sản phẩm |
| `inventory_transactions` | Log nhập/xuất kho, audit trail tồn kho |
| `search_logs` | Lưu từ khóa tìm kiếm để phân tích hành vi |

***

## Sơ Đồ Quan Hệ Tổng Quan

```
users ──→ user_addresses
users ──→ carts ──→ cart_items ──→ product_variants
users ──→ bills ──→ bill_details ──→ product_variants
                ──→ order_status_logs
                ──→ payment_transactions
                ──→ shipments
users ──→ reviews (qua bill_details) ──→ review_images
                                     ──→ review_replies

products ──→ product_types (self-join)
         ──→ collections
         ──→ suppliers
         ──→ product_variants
         ──→ product_images
         ──→ product_attributes
         ──→ product_tags ──→ tags

coupons ──→ coupon_usages ──→ bills
flash_sales ──→ flash_sale_items ──→ product_variants
```