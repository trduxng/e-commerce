-- ============================================================
-- DATABASE: ECommerceDB
-- Platform: Microsoft SQL Server (T-SQL)
-- Standard:  3NF | snake_case | 7 schemas | 32 tables
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ECommerceDB')
    CREATE DATABASE ECommerceDB;
GO

USE ECommerceDB;
GO

-- ============================================================
-- CREATE SCHEMAS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'auth')        EXEC('CREATE SCHEMA auth');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'catalog')     EXEC('CREATE SCHEMA catalog');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'orders')      EXEC('CREATE SCHEMA orders');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'reviews')     EXEC('CREATE SCHEMA reviews');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'promotions')  EXEC('CREATE SCHEMA promotions');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'payment')     EXEC('CREATE SCHEMA payment');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'operations')  EXEC('CREATE SCHEMA operations');
GO

-- ============================================================
-- NHÓM 1: auth
-- ============================================================

-- [1] auth.users — Bảng trung tâm cho mọi loại người dùng
CREATE TABLE auth.users (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    email               NVARCHAR(255)           NOT NULL,
    password_hash       NVARCHAR(500)           NOT NULL,
    phone               NVARCHAR(20)            NULL,
    full_name           NVARCHAR(100)           NOT NULL,
    avatar_url          NVARCHAR(1000)          NULL,
    role                NVARCHAR(20)            NOT NULL CONSTRAINT DF_users_role    DEFAULT 'customer',
    status              NVARCHAR(20)            NOT NULL CONSTRAINT DF_users_status  DEFAULT 'unverified',
    email_verified_at   DATETIME2               NULL,
    last_login_at       DATETIME2               NULL,
    deleted_at          DATETIME2               NULL,
    created_at          DATETIME2               NOT NULL CONSTRAINT DF_users_created_at DEFAULT GETDATE(),
    updated_at          DATETIME2               NOT NULL CONSTRAINT DF_users_updated_at DEFAULT GETDATE(),

    CONSTRAINT PK_users             PRIMARY KEY (id),
    CONSTRAINT UQ_users_email       UNIQUE      (email),
    CONSTRAINT CK_users_role        CHECK       (role   IN ('customer','staff','admin')),
    CONSTRAINT CK_users_status      CHECK       (status IN ('active','banned','unverified'))
);
GO

-- [2] auth.user_addresses — Nhiều địa chỉ giao hàng trên mỗi người dùng
CREATE TABLE auth.user_addresses (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    user_id         BIGINT                  NOT NULL,
    receiver_name   NVARCHAR(100)           NOT NULL,
    phone           NVARCHAR(20)            NOT NULL,
    province        NVARCHAR(100)           NOT NULL,
    district        NVARCHAR(100)           NOT NULL,
    ward            NVARCHAR(100)           NOT NULL,
    address_detail  NVARCHAR(500)           NOT NULL,
    is_default      BIT                     NOT NULL CONSTRAINT DF_user_addresses_is_default DEFAULT 0,
    created_at      DATETIME2               NOT NULL CONSTRAINT DF_user_addresses_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_user_addresses        PRIMARY KEY (id),
    CONSTRAINT FK_user_addresses_users  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
GO

-- [3] auth.admin_logs — Audit trail cho mọi hành động của admin/staff
CREATE TABLE auth.admin_logs (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    admin_id        BIGINT                  NOT NULL,
    action          NVARCHAR(100)           NOT NULL,
    target_table    NVARCHAR(100)           NOT NULL,
    target_id       BIGINT                  NOT NULL,
    old_value       NVARCHAR(MAX)           NULL,   -- JSON
    new_value       NVARCHAR(MAX)           NULL,   -- JSON
    ip_address      NVARCHAR(45)            NULL,   -- IPv4 + IPv6
    user_agent      NVARCHAR(500)           NULL,
    created_at      DATETIME2               NOT NULL CONSTRAINT DF_admin_logs_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_admin_logs            PRIMARY KEY (id),
    CONSTRAINT FK_admin_logs_users      FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
GO

-- [4] auth.password_reset_tokens — Token đặt lại mật khẩu (one-time use)
CREATE TABLE auth.password_reset_tokens (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    user_id     BIGINT                  NOT NULL,
    token_hash  NVARCHAR(255)           NOT NULL,
    expires_at  DATETIME2               NOT NULL,
    used_at     DATETIME2               NULL,
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_prt_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_password_reset_tokens         PRIMARY KEY (id),
    CONSTRAINT FK_password_reset_tokens_users   FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
GO

-- ============================================================
-- NHÓM 2: catalog
-- ============================================================

-- [5] catalog.product_types — Danh mục sản phẩm, hỗ trợ lồng nhau (self-reference)
CREATE TABLE catalog.product_types (
    id          INT IDENTITY(1,1)       NOT NULL,
    name        NVARCHAR(100)           NOT NULL,
    slug        NVARCHAR(100)           NOT NULL,
    description NVARCHAR(500)           NULL,
    parent_id   INT                     NULL,   -- Self-reference: danh mục cha
    image_url   NVARCHAR(1000)          NULL,
    is_active   BIT                     NOT NULL CONSTRAINT DF_product_types_is_active  DEFAULT 1,
    sort_order  INT                     NOT NULL CONSTRAINT DF_product_types_sort_order DEFAULT 0,

    CONSTRAINT PK_product_types             PRIMARY KEY (id),
    CONSTRAINT UQ_product_types_slug        UNIQUE      (slug),
    CONSTRAINT FK_product_types_parent      FOREIGN KEY (parent_id) REFERENCES catalog.product_types(id)
);
GO

-- [6] catalog.suppliers — Nhà cung cấp / đối tác sản phẩm
CREATE TABLE catalog.suppliers (
    id          INT IDENTITY(1,1)       NOT NULL,
    name        NVARCHAR(150)           NOT NULL,
    email       NVARCHAR(150)           NULL,
    phone       NVARCHAR(20)            NULL,
    address     NVARCHAR(500)           NULL,
    country     NVARCHAR(100)           NOT NULL CONSTRAINT DF_suppliers_country DEFAULT N'Vietnam',
    status      NVARCHAR(20)            NOT NULL CONSTRAINT DF_suppliers_status  DEFAULT 'active',
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_suppliers_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_suppliers         PRIMARY KEY (id),
    CONSTRAINT CK_suppliers_status  CHECK       (status IN ('active','inactive'))
);
GO

-- [7] catalog.collections — Bộ sưu tập / series sản phẩm theo mùa hoặc chủ đề
CREATE TABLE catalog.collections (
    id          INT IDENTITY(1,1)       NOT NULL,
    name        NVARCHAR(150)           NOT NULL,
    slug        NVARCHAR(150)           NOT NULL,
    description NVARCHAR(1000)          NULL,
    banner_url  NVARCHAR(1000)          NULL,
    start_date  DATE                    NULL,
    end_date    DATE                    NULL,
    is_active   BIT                     NOT NULL CONSTRAINT DF_collections_is_active DEFAULT 1,

    CONSTRAINT PK_collections       PRIMARY KEY (id),
    CONSTRAINT UQ_collections_slug  UNIQUE      (slug)
);
GO

-- [8] catalog.products — Sản phẩm chính (thông tin chung, không phân biệt biến thể)
CREATE TABLE catalog.products (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    name                NVARCHAR(255)           NOT NULL,
    slug                NVARCHAR(255)           NOT NULL,
    product_type_id     INT                     NOT NULL,
    collection_id       INT                     NULL,
    supplier_id         INT                     NULL,
    description         NVARCHAR(MAX)           NULL,
    short_description   NVARCHAR(500)           NULL,
    base_price          DECIMAL(15,2)           NOT NULL,
    thumbnail_url       NVARCHAR(1000)          NULL,
    is_active           BIT                     NOT NULL CONSTRAINT DF_products_is_active   DEFAULT 1,
    is_featured         BIT                     NOT NULL CONSTRAINT DF_products_is_featured DEFAULT 0,
    sold_count          INT                     NOT NULL CONSTRAINT DF_products_sold_count  DEFAULT 0,
    view_count          INT                     NOT NULL CONSTRAINT DF_products_view_count  DEFAULT 0,
    deleted_at          DATETIME2               NULL,
    created_at          DATETIME2               NOT NULL CONSTRAINT DF_products_created_at  DEFAULT GETDATE(),
    updated_at          DATETIME2               NOT NULL CONSTRAINT DF_products_updated_at  DEFAULT GETDATE(),

    CONSTRAINT PK_products                  PRIMARY KEY (id),
    CONSTRAINT UQ_products_slug             UNIQUE      (slug),
    CONSTRAINT FK_products_product_types    FOREIGN KEY (product_type_id) REFERENCES catalog.product_types(id),
    CONSTRAINT FK_products_collections      FOREIGN KEY (collection_id)   REFERENCES catalog.collections(id),
    CONSTRAINT FK_products_suppliers        FOREIGN KEY (supplier_id)     REFERENCES catalog.suppliers(id)
);
GO

-- [9] catalog.product_variants — Biến thể sản phẩm (size, màu, tồn kho, giá riêng)
CREATE TABLE catalog.product_variants (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    product_id      BIGINT                  NOT NULL,
    size            NVARCHAR(20)            NULL,
    color           NVARCHAR(50)            NULL,
    sku             NVARCHAR(120)           NOT NULL,
    price           DECIMAL(15,2)           NOT NULL,
    sale_price      DECIMAL(15,2)           NULL,
    stock_quantity  INT                     NOT NULL CONSTRAINT DF_pv_stock_quantity DEFAULT 0,
    weight_gram     INT                     NULL,
    image_url       NVARCHAR(1000)          NULL,
    is_active       BIT                     NOT NULL CONSTRAINT DF_pv_is_active      DEFAULT 1,

    CONSTRAINT PK_product_variants          PRIMARY KEY (id),
    CONSTRAINT UQ_product_variants_sku      UNIQUE      (sku),
    CONSTRAINT FK_product_variants_products FOREIGN KEY (product_id) REFERENCES catalog.products(id),
    CONSTRAINT CK_product_variants_price    CHECK       (price >= 0),
    CONSTRAINT CK_product_variants_stock    CHECK       (stock_quantity >= 0)
);
GO

-- [10] catalog.product_images — Nhiều ảnh cho mỗi sản phẩm
CREATE TABLE catalog.product_images (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    product_id  BIGINT                  NOT NULL,
    image_url   NVARCHAR(1000)          NOT NULL,
    alt_text    NVARCHAR(255)           NULL,
    sort_order  INT                     NOT NULL CONSTRAINT DF_product_images_sort_order DEFAULT 0,
    is_primary  BIT                     NOT NULL CONSTRAINT DF_product_images_is_primary DEFAULT 0,

    CONSTRAINT PK_product_images            PRIMARY KEY (id),
    CONSTRAINT FK_product_images_products   FOREIGN KEY (product_id) REFERENCES catalog.products(id)
);
GO

-- [11] catalog.product_attributes — Thuộc tính động (chất liệu, xuất xứ, v.v.)
CREATE TABLE catalog.product_attributes (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    product_id      BIGINT                  NOT NULL,
    attribute_name  NVARCHAR(100)           NOT NULL,
    attribute_value NVARCHAR(255)           NOT NULL,

    CONSTRAINT PK_product_attributes            PRIMARY KEY (id),
    CONSTRAINT FK_product_attributes_products   FOREIGN KEY (product_id) REFERENCES catalog.products(id)
);
GO

-- [12] catalog.tags — Nhãn phân loại linh hoạt cho sản phẩm
CREATE TABLE catalog.tags (
    id      INT IDENTITY(1,1)   NOT NULL,
    name    NVARCHAR(100)       NOT NULL,
    slug    NVARCHAR(100)       NOT NULL,

    CONSTRAINT PK_tags      PRIMARY KEY (id),
    CONSTRAINT UQ_tags_slug UNIQUE      (slug)
);
GO

-- [13] catalog.product_tags — Quan hệ nhiều-nhiều: sản phẩm ↔ nhãn
CREATE TABLE catalog.product_tags (
    product_id  BIGINT  NOT NULL,
    tag_id      INT     NOT NULL,

    CONSTRAINT PK_product_tags              PRIMARY KEY (product_id, tag_id),
    CONSTRAINT FK_product_tags_products     FOREIGN KEY (product_id) REFERENCES catalog.products(id),
    CONSTRAINT FK_product_tags_tags         FOREIGN KEY (tag_id)     REFERENCES catalog.tags(id)
);
GO

-- ============================================================
-- NHÓM 3: orders
-- ============================================================

-- [14] orders.carts — Giỏ hàng (hỗ trợ cả guest lẫn user đã đăng nhập)
CREATE TABLE orders.carts (
    id              BIGINT IDENTITY(1,1)    NOT NULL,
    user_id         BIGINT                  NULL,   -- NULL = guest
    session_token   NVARCHAR(255)           NULL,
    created_at      DATETIME2               NOT NULL CONSTRAINT DF_carts_created_at DEFAULT GETDATE(),
    updated_at      DATETIME2               NOT NULL CONSTRAINT DF_carts_updated_at DEFAULT GETDATE(),

    CONSTRAINT PK_carts                 PRIMARY KEY (id),
    CONSTRAINT UQ_carts_session_token   UNIQUE      (session_token),
    CONSTRAINT FK_carts_users           FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
GO

-- [15] orders.cart_items — Chi tiết từng sản phẩm trong giỏ hàng
CREATE TABLE orders.cart_items (
    id                      BIGINT IDENTITY(1,1)    NOT NULL,
    cart_id                 BIGINT                  NOT NULL,
    product_variant_id      BIGINT                  NOT NULL,
    quantity                INT                     NOT NULL CONSTRAINT CK_cart_items_qty CHECK (quantity >= 1),
    price_snapshot          DECIMAL(15,2)           NOT NULL,   -- Giá lúc thêm vào giỏ

    CONSTRAINT PK_cart_items                        PRIMARY KEY (id),
    CONSTRAINT FK_cart_items_carts                  FOREIGN KEY (cart_id)            REFERENCES orders.carts(id),
    CONSTRAINT FK_cart_items_product_variants       FOREIGN KEY (product_variant_id) REFERENCES catalog.product_variants(id)
);
GO

-- [16] orders.bills — Đơn hàng (snapshot địa chỉ bắt buộc)
CREATE TABLE orders.bills (
    id                      BIGINT IDENTITY(1,1)    NOT NULL,
    order_code              NVARCHAR(30)            NOT NULL,   -- ORD-YYYY-NNNNN
    user_id                 BIGINT                  NULL,       -- NULL = guest
    guest_email             NVARCHAR(255)           NULL,
    receiver_name           NVARCHAR(100)           NOT NULL,
    receiver_phone          NVARCHAR(20)            NOT NULL,
    shipping_address_full   NVARCHAR(MAX)           NOT NULL,   -- Snapshot địa chỉ
    subtotal                DECIMAL(15,2)           NOT NULL,
    shipping_fee            DECIMAL(15,2)           NOT NULL CONSTRAINT DF_bills_shipping_fee      DEFAULT 0,
    discount_amount         DECIMAL(15,2)           NOT NULL CONSTRAINT DF_bills_discount_amount   DEFAULT 0,
    tax_amount              DECIMAL(15,2)           NOT NULL CONSTRAINT DF_bills_tax_amount        DEFAULT 0,
    total_amount            DECIMAL(15,2)           NOT NULL,
    payment_method          NVARCHAR(20)            NOT NULL,
    payment_status          NVARCHAR(20)            NOT NULL CONSTRAINT DF_bills_payment_status    DEFAULT 'pending',
    order_status            NVARCHAR(20)            NOT NULL CONSTRAINT DF_bills_order_status      DEFAULT 'pending',
    coupon_code             NVARCHAR(50)            NULL,
    note                    NVARCHAR(1000)          NULL,
    cancelled_reason        NVARCHAR(500)           NULL,
    created_at              DATETIME2               NOT NULL CONSTRAINT DF_bills_created_at DEFAULT GETDATE(),
    updated_at              DATETIME2               NOT NULL CONSTRAINT DF_bills_updated_at DEFAULT GETDATE(),

    CONSTRAINT PK_bills                     PRIMARY KEY (id),
    CONSTRAINT UQ_bills_order_code          UNIQUE      (order_code),
    CONSTRAINT FK_bills_users               FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT CK_bills_payment_method      CHECK       (payment_method  IN ('cod','vnpay','momo','bank_transfer')),
    CONSTRAINT CK_bills_payment_status      CHECK       (payment_status  IN ('pending','paid','refunded')),
    CONSTRAINT CK_bills_order_status        CHECK       (order_status    IN ('pending','confirmed','shipping','delivered','cancelled','return_requested','returned','refunded','return_rejected')),
    CONSTRAINT CK_bills_total_amount        CHECK       (total_amount >= 0)
);
GO

-- [17] orders.bill_details — Chi tiết đơn hàng với snapshot đầy đủ
CREATE TABLE orders.bill_details (
    id                      BIGINT IDENTITY(1,1)    NOT NULL,
    bill_id                 BIGINT                  NOT NULL,
    product_variant_id      BIGINT                  NOT NULL,
    product_name_snapshot   NVARCHAR(255)           NOT NULL,   -- Snapshot tên SP
    size_snapshot           NVARCHAR(20)            NULL,       -- Snapshot size
    color_snapshot          NVARCHAR(50)            NULL,       -- Snapshot màu
    sku_snapshot            NVARCHAR(120)           NOT NULL,   -- Snapshot SKU
    quantity                INT                     NOT NULL CONSTRAINT CK_bill_details_qty CHECK (quantity >= 1),
    unit_price              DECIMAL(15,2)           NOT NULL,
    total_price             DECIMAL(15,2)           NOT NULL,

    CONSTRAINT PK_bill_details                  PRIMARY KEY (id),
    CONSTRAINT FK_bill_details_bills            FOREIGN KEY (bill_id)            REFERENCES orders.bills(id),
    CONSTRAINT FK_bill_details_pv               FOREIGN KEY (product_variant_id) REFERENCES catalog.product_variants(id)
);
GO

-- [18] orders.order_status_logs — Lịch sử thay đổi trạng thái đơn hàng
CREATE TABLE orders.order_status_logs (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    bill_id     BIGINT                  NOT NULL,
    from_status NVARCHAR(50)            NULL,   -- NULL khi tạo lần đầu
    to_status   NVARCHAR(50)            NOT NULL,
    note        NVARCHAR(500)           NULL,
    created_by  BIGINT                  NOT NULL,
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_osl_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_order_status_logs         PRIMARY KEY (id),
    CONSTRAINT FK_order_status_logs_bills   FOREIGN KEY (bill_id)     REFERENCES orders.bills(id),
    CONSTRAINT FK_order_status_logs_users   FOREIGN KEY (created_by)  REFERENCES auth.users(id)
);
GO

-- ============================================================
-- NHÓM 4: reviews
-- ============================================================

-- [19] reviews.reviews — Nhận xét sản phẩm, chỉ người đã mua mới được đánh giá
CREATE TABLE reviews.reviews (
    id                      BIGINT IDENTITY(1,1)    NOT NULL,
    user_id                 BIGINT                  NOT NULL,
    product_id              BIGINT                  NOT NULL,
    bill_detail_id          BIGINT                  NOT NULL,   -- Bắt buộc đã mua
    rating                  TINYINT                 NOT NULL,
    title                   NVARCHAR(255)           NULL,
    content                 NVARCHAR(MAX)           NULL,
    is_verified_purchase    BIT                     NOT NULL CONSTRAINT DF_reviews_verified     DEFAULT 1,
    helpful_count           INT                     NOT NULL CONSTRAINT DF_reviews_helpful      DEFAULT 0,
    status                  NVARCHAR(20)            NOT NULL CONSTRAINT DF_reviews_status       DEFAULT 'pending',
    created_at              DATETIME2               NOT NULL CONSTRAINT DF_reviews_created_at   DEFAULT GETDATE(),

    CONSTRAINT PK_reviews                       PRIMARY KEY (id),
    CONSTRAINT UQ_reviews_user_bill_detail      UNIQUE      (user_id, bill_detail_id),   -- Không review 2 lần
    CONSTRAINT FK_reviews_users                 FOREIGN KEY (user_id)        REFERENCES auth.users(id),
    CONSTRAINT FK_reviews_products              FOREIGN KEY (product_id)     REFERENCES catalog.products(id),
    CONSTRAINT FK_reviews_bill_details          FOREIGN KEY (bill_detail_id) REFERENCES orders.bill_details(id),
    CONSTRAINT CK_reviews_rating                CHECK       (rating BETWEEN 1 AND 5),
    CONSTRAINT CK_reviews_status                CHECK       (status IN ('pending','approved','rejected'))
);
GO

-- [20] reviews.review_images — Ảnh đính kèm theo từng nhận xét
CREATE TABLE reviews.review_images (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    review_id   BIGINT                  NOT NULL,
    image_url   NVARCHAR(1000)          NOT NULL,
    sort_order  INT                     NOT NULL CONSTRAINT DF_review_images_sort DEFAULT 0,

    CONSTRAINT PK_review_images         PRIMARY KEY (id),
    CONSTRAINT FK_review_images_reviews FOREIGN KEY (review_id) REFERENCES reviews.reviews(id)
);
GO

-- [21] reviews.review_replies — Admin/staff phản hồi nhận xét của khách
CREATE TABLE reviews.review_replies (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    review_id   BIGINT                  NOT NULL,
    admin_id    BIGINT                  NOT NULL,
    content     NVARCHAR(MAX)           NOT NULL,
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_review_replies_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_review_replies            PRIMARY KEY (id),
    CONSTRAINT FK_review_replies_reviews    FOREIGN KEY (review_id) REFERENCES reviews.reviews(id),
    CONSTRAINT FK_review_replies_users      FOREIGN KEY (admin_id)  REFERENCES auth.users(id)
);
GO

-- ============================================================
-- NHÓM 5: promotions
-- ============================================================

-- [22] promotions.coupons — Mã giảm giá với nhiều loại và điều kiện
CREATE TABLE promotions.coupons (
    id                      INT IDENTITY(1,1)       NOT NULL,
    code                    NVARCHAR(50)            NOT NULL,
    type                    NVARCHAR(20)            NOT NULL,
    value                   DECIMAL(10,2)           NOT NULL,
    min_order_value         DECIMAL(15,2)           NOT NULL CONSTRAINT DF_coupons_min_order    DEFAULT 0,
    max_discount_amount     DECIMAL(15,2)           NULL,
    usage_limit             INT                     NULL,       -- NULL = không giới hạn
    used_count              INT                     NOT NULL CONSTRAINT DF_coupons_used_count   DEFAULT 0,
    start_date              DATETIME2               NOT NULL,
    end_date                DATETIME2               NOT NULL,
    is_active               BIT                     NOT NULL CONSTRAINT DF_coupons_is_active    DEFAULT 1,

    CONSTRAINT PK_coupons       PRIMARY KEY (id),
    CONSTRAINT UQ_coupons_code  UNIQUE      (code),
    CONSTRAINT CK_coupons_type  CHECK       (type IN ('percent','fixed','free_ship')),
    CONSTRAINT CK_coupons_value CHECK       (value >= 0),
    CONSTRAINT CK_coupons_dates CHECK       (end_date > start_date)
);
GO

-- [23] promotions.coupon_usages — Lịch sử sử dụng coupon (audit trail)
CREATE TABLE promotions.coupon_usages (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    coupon_id           INT                     NOT NULL,
    user_id             BIGINT                  NOT NULL,
    bill_id             BIGINT                  NOT NULL,
    discount_applied    DECIMAL(15,2)           NOT NULL,
    used_at             DATETIME2               NOT NULL CONSTRAINT DF_coupon_usages_used_at DEFAULT GETDATE(),

    CONSTRAINT PK_coupon_usages             PRIMARY KEY (id),
    CONSTRAINT FK_coupon_usages_coupons     FOREIGN KEY (coupon_id) REFERENCES promotions.coupons(id),
    CONSTRAINT FK_coupon_usages_users       FOREIGN KEY (user_id)   REFERENCES auth.users(id),
    CONSTRAINT FK_coupon_usages_bills       FOREIGN KEY (bill_id)   REFERENCES orders.bills(id)
);
GO

-- [24] promotions.flash_sales — Flash sale theo khung thời gian
CREATE TABLE promotions.flash_sales (
    id          INT IDENTITY(1,1)   NOT NULL,
    name        NVARCHAR(150)       NOT NULL,
    start_time  DATETIME2           NOT NULL,
    end_time    DATETIME2           NOT NULL,
    is_active   BIT                 NOT NULL CONSTRAINT DF_flash_sales_is_active DEFAULT 1,

    CONSTRAINT PK_flash_sales       PRIMARY KEY (id),
    CONSTRAINT CK_flash_sales_time  CHECK       (end_time > start_time)
);
GO

-- [25] promotions.flash_sale_items — Sản phẩm tham gia flash sale với giá và số lượng giới hạn
CREATE TABLE promotions.flash_sale_items (
    id                  INT IDENTITY(1,1)   NOT NULL,
    flash_sale_id       INT                 NOT NULL,
    product_variant_id  BIGINT              NOT NULL,
    sale_price          DECIMAL(15,2)       NOT NULL,
    quantity_limit      INT                 NULL,       -- NULL = không giới hạn SL
    sold_count          INT                 NOT NULL CONSTRAINT DF_fsi_sold_count DEFAULT 0,

    CONSTRAINT PK_flash_sale_items          PRIMARY KEY (id),
    CONSTRAINT FK_fsi_flash_sales           FOREIGN KEY (flash_sale_id)      REFERENCES promotions.flash_sales(id),
    CONSTRAINT FK_fsi_product_variants      FOREIGN KEY (product_variant_id) REFERENCES catalog.product_variants(id),
    CONSTRAINT CK_fsi_sale_price            CHECK       (sale_price >= 0)
);
GO

-- ============================================================
-- NHÓM 6: payment
-- ============================================================

-- [26] payment.payment_transactions — Giao dịch với cổng thanh toán
CREATE TABLE payment.payment_transactions (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    bill_id             BIGINT                  NOT NULL,
    gateway             NVARCHAR(50)            NOT NULL,   -- vnpay, momo, zalopay
    transaction_code    NVARCHAR(255)           NULL,
    amount              DECIMAL(15,2)           NOT NULL,
    status              NVARCHAR(20)            NOT NULL CONSTRAINT DF_pt_status DEFAULT 'pending',
    gateway_response    NVARCHAR(MAX)           NULL,       -- JSON raw response
    paid_at             DATETIME2               NULL,
    created_at          DATETIME2               NOT NULL CONSTRAINT DF_pt_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_payment_transactions          PRIMARY KEY (id),
    CONSTRAINT FK_payment_transactions_bills    FOREIGN KEY (bill_id) REFERENCES orders.bills(id),
    CONSTRAINT CK_payment_transactions_status   CHECK       (status IN ('pending','success','failed','refunded'))
);
GO

-- [27] payment.shipments — Thông tin vận chuyển và tracking
CREATE TABLE payment.shipments (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    bill_id             BIGINT                  NOT NULL,
    carrier             NVARCHAR(50)            NOT NULL,   -- GHN, GHTK, ViettelPost
    tracking_code       NVARCHAR(100)           NULL,
    status              NVARCHAR(50)            NOT NULL CONSTRAINT DF_shipments_status DEFAULT 'pending',
    estimated_delivery  DATE                    NULL,
    carrier_fee         DECIMAL(15,2)           NULL,
    shipped_at          DATETIME2               NULL,
    delivered_at        DATETIME2               NULL,

    CONSTRAINT PK_shipments         PRIMARY KEY (id),
    CONSTRAINT FK_shipments_bills   FOREIGN KEY (bill_id) REFERENCES orders.bills(id)
);
GO

-- ============================================================
-- NHÓM 7: operations
-- ============================================================

-- [28] operations.wishlists — Danh sách sản phẩm yêu thích của người dùng
CREATE TABLE operations.wishlists (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    user_id     BIGINT                  NOT NULL,
    product_id  BIGINT                  NOT NULL,
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_wishlists_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_wishlists                 PRIMARY KEY (id),
    CONSTRAINT UQ_wishlists_user_product    UNIQUE      (user_id, product_id),
    CONSTRAINT FK_wishlists_users           FOREIGN KEY (user_id)    REFERENCES auth.users(id),
    CONSTRAINT FK_wishlists_products        FOREIGN KEY (product_id) REFERENCES catalog.products(id)
);
GO

-- [29] operations.notifications — Thông báo hệ thống gửi đến người dùng
CREATE TABLE operations.notifications (
    id          BIGINT IDENTITY(1,1)    NOT NULL,
    user_id     BIGINT                  NOT NULL,
    type        NVARCHAR(50)            NOT NULL,   -- ORDER_UPDATE, PROMOTION, REVIEW_REPLY
    title       NVARCHAR(255)           NOT NULL,
    message     NVARCHAR(MAX)           NOT NULL,
    is_read     BIT                     NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
    link        NVARCHAR(500)           NULL,
    created_at  DATETIME2               NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_notifications         PRIMARY KEY (id),
    CONSTRAINT FK_notifications_users   FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
GO

-- [30] operations.banners — Banner quảng cáo cho trang chủ và các vị trí khác
CREATE TABLE operations.banners (
    id          INT IDENTITY(1,1)   NOT NULL,
    image_url   NVARCHAR(1000)      NOT NULL,
    link_url    NVARCHAR(1000)      NULL,
    title       NVARCHAR(255)       NULL,
    position    NVARCHAR(50)        NOT NULL CONSTRAINT DF_banners_position DEFAULT 'home_top',
    is_active   BIT                 NOT NULL CONSTRAINT DF_banners_is_active DEFAULT 1,
    sort_order  INT                 NOT NULL CONSTRAINT DF_banners_sort_order DEFAULT 0,

    CONSTRAINT PK_banners PRIMARY KEY (id)
);
GO

-- [31] operations.settings — Cấu hình hệ thống động, không cần deploy lại
CREATE TABLE operations.settings (
    [key]       NVARCHAR(100)   NOT NULL,
    value       NVARCHAR(MAX)   NOT NULL,
    description NVARCHAR(500)   NULL,
    group_name  NVARCHAR(50)    NULL,   -- general, payment, shipping

    CONSTRAINT PK_settings      PRIMARY KEY ([key]),
    CONSTRAINT UQ_settings_key  UNIQUE      ([key])
);
GO

-- [32] operations.inventory_transactions — Audit trail nhập/xuất/điều chỉnh tồn kho
CREATE TABLE operations.inventory_transactions (
    id                  BIGINT IDENTITY(1,1)    NOT NULL,
    product_variant_id  BIGINT                  NOT NULL,
    type                NVARCHAR(20)            NOT NULL,
    quantity_change     INT                     NOT NULL,   -- (+) nhập, (-) xuất
    stock_before        INT                     NOT NULL,
    stock_after         INT                     NOT NULL,
    reference_id        BIGINT                  NULL,       -- bill_id hoặc phiếu nhập
    note                NVARCHAR(500)           NULL,
    created_by          BIGINT                  NOT NULL,
    created_at          DATETIME2               NOT NULL CONSTRAINT DF_inv_created_at DEFAULT GETDATE(),

    CONSTRAINT PK_inventory_transactions            PRIMARY KEY (id),
    CONSTRAINT FK_inv_transactions_pv               FOREIGN KEY (product_variant_id) REFERENCES catalog.product_variants(id),
    CONSTRAINT FK_inv_transactions_users            FOREIGN KEY (created_by)         REFERENCES auth.users(id),
    CONSTRAINT CK_inventory_transactions_type       CHECK       (type IN ('import','export','adjustment','return'))
);
GO


-- ============================================================
-- INDEXES
-- ============================================================

-- auth.users
CREATE UNIQUE NONCLUSTERED INDEX UX_users_email
    ON auth.users(email) WHERE deleted_at IS NULL;
CREATE NONCLUSTERED INDEX IX_users_role_status
    ON auth.users(role, status) INCLUDE (full_name, email);

-- auth.user_addresses
CREATE NONCLUSTERED INDEX IX_user_addresses_user_id
    ON auth.user_addresses(user_id) INCLUDE (is_default);

-- auth.admin_logs
CREATE NONCLUSTERED INDEX IX_admin_logs_admin_id
    ON auth.admin_logs(admin_id, created_at DESC);

-- catalog.product_types
CREATE NONCLUSTERED INDEX IX_product_types_parent_id
    ON catalog.product_types(parent_id) WHERE parent_id IS NOT NULL;

-- catalog.products
CREATE NONCLUSTERED INDEX IX_products_type_active
    ON catalog.products(product_type_id, is_active) INCLUDE (name, base_price, thumbnail_url);
CREATE NONCLUSTERED INDEX IX_products_collection
    ON catalog.products(collection_id) WHERE collection_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_products_featured
    ON catalog.products(is_featured, is_active) WHERE deleted_at IS NULL;

-- catalog.product_variants
CREATE NONCLUSTERED INDEX IX_product_variants_product_id
    ON catalog.product_variants(product_id) INCLUDE (sku, price, sale_price, stock_quantity);

-- orders.bills — Composite index quan trọng nhất
CREATE NONCLUSTERED INDEX IX_bills_user_status
    ON orders.bills(user_id, order_status) INCLUDE (order_code, total_amount, created_at);
CREATE NONCLUSTERED INDEX IX_bills_created_at
    ON orders.bills(created_at DESC);

-- orders.bill_details
CREATE NONCLUSTERED INDEX IX_bill_details_bill_id
    ON orders.bill_details(bill_id);
CREATE NONCLUSTERED INDEX IX_bill_details_variant_id
    ON orders.bill_details(product_variant_id);

-- reviews.reviews — Composite index
CREATE NONCLUSTERED INDEX IX_reviews_product_status
    ON reviews.reviews(product_id, status) INCLUDE (rating, created_at);
CREATE NONCLUSTERED INDEX IX_reviews_user_id
    ON reviews.reviews(user_id);

-- operations.notifications
CREATE NONCLUSTERED INDEX IX_notifications_user_unread
    ON operations.notifications(user_id, is_read) INCLUDE (title, created_at)
    WHERE is_read = 0;

-- payment.payment_transactions
CREATE NONCLUSTERED INDEX IX_payment_transactions_bill_id
    ON payment.payment_transactions(bill_id, status);

-- operations.inventory_transactions
CREATE NONCLUSTERED INDEX IX_inv_transactions_variant_id
    ON operations.inventory_transactions(product_variant_id, created_at DESC);

GO


-- ============================================================
-- TRIGGERS
-- ============================================================

-- TR_1: Tự động cập nhật updated_at cho auth.users
CREATE OR ALTER TRIGGER auth.TR_users_updated_at
ON auth.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE auth.users
    SET updated_at = GETDATE()
    FROM auth.users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- TR_2: Tự động cập nhật updated_at cho catalog.products
CREATE OR ALTER TRIGGER catalog.TR_products_updated_at
ON catalog.products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE catalog.products
    SET updated_at = GETDATE()
    FROM catalog.products p
    INNER JOIN inserted i ON p.id = i.id;
END;
GO

-- TR_3: Tự động cập nhật updated_at cho orders.bills
CREATE OR ALTER TRIGGER orders.TR_bills_updated_at
ON orders.bills
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE orders.bills
    SET updated_at = GETDATE()
    FROM orders.bills b
    INNER JOIN inserted i ON b.id = i.id;
END;
GO

-- TR_4: Ghi log inventory khi stock_quantity của product_variants thay đổi
CREATE OR ALTER TRIGGER catalog.TR_product_variants_stock_log
ON catalog.product_variants
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(stock_quantity)
    BEGIN
        INSERT INTO operations.inventory_transactions
            (product_variant_id, type, quantity_change, stock_before, stock_after, note, created_by)
        SELECT
            i.id,
            'adjustment',
            i.stock_quantity - d.stock_quantity,
            d.stock_quantity,
            i.stock_quantity,
            N'Auto-log từ trigger khi cập nhật tồn kho',
            1   -- system user id
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.stock_quantity <> d.stock_quantity;
    END
END;
GO

-- TR_5: Cập nhật carts.updated_at khi cart_items thay đổi
CREATE OR ALTER TRIGGER orders.TR_carts_updated_at_on_item_change
ON orders.cart_items
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @cart_id BIGINT;

    SELECT @cart_id = COALESCE(
        (SELECT TOP 1 cart_id FROM inserted),
        (SELECT TOP 1 cart_id FROM deleted)
    );

    IF @cart_id IS NOT NULL
        UPDATE orders.carts SET updated_at = GETDATE() WHERE id = @cart_id;
END;
GO


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- SP_1: Đặt hàng — tạo bill, bill_details, trừ tồn kho (atomic)
CREATE OR ALTER PROCEDURE orders.sp_PlaceOrder
    @user_id                BIGINT,
    @receiver_name          NVARCHAR(100),
    @receiver_phone         NVARCHAR(20),
    @shipping_address_full  NVARCHAR(MAX),
    @payment_method         NVARCHAR(20),
    @coupon_code            NVARCHAR(50) = NULL,
    @note                   NVARCHAR(1000) = NULL,
    @new_bill_id            BIGINT OUTPUT,
    @new_order_code         NVARCHAR(30) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lấy cart của user
        DECLARE @cart_id BIGINT;
        SELECT TOP 1 @cart_id = id FROM orders.carts WHERE user_id = @user_id;
        IF @cart_id IS NULL RAISERROR(N'Giỏ hàng không tồn tại.', 16, 1);

        -- Kiểm tra giỏ không rỗng
        IF NOT EXISTS (SELECT 1 FROM orders.cart_items WHERE cart_id = @cart_id)
            RAISERROR(N'Giỏ hàng trống.', 16, 1);

        -- Kiểm tra tồn kho
        IF EXISTS (
            SELECT 1 FROM orders.cart_items ci
            INNER JOIN catalog.product_variants pv ON ci.product_variant_id = pv.id
            WHERE ci.cart_id = @cart_id AND pv.stock_quantity < ci.quantity
        )
        RAISERROR(N'Một hoặc nhiều sản phẩm không đủ tồn kho.', 16, 1);

        -- Tính subtotal
        DECLARE @subtotal DECIMAL(15,2);
        SELECT @subtotal = SUM(ci.quantity * ci.price_snapshot)
        FROM orders.cart_items ci WHERE ci.cart_id = @cart_id;

        -- Tạo order_code
        SET @new_order_code = 'ORD-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
                              + '-' + RIGHT('00000' + CAST(NEXT VALUE FOR IF NOT EXISTS
                              (SELECT 1 FROM sys.sequences WHERE name='seq_order') 
                              -- fallback nếu sequence chưa có
                              SELECT @subtotal AS dummy), 5);
        SET @new_order_code = 'ORD-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
                              + '-' + RIGHT('00000' + CAST(
                                  (SELECT ISNULL(MAX(id),0)+1 FROM orders.bills)
                              , 5), 5);

        -- Tạo bill
        INSERT INTO orders.bills
            (order_code, user_id, receiver_name, receiver_phone,
             shipping_address_full, subtotal, total_amount,
             payment_method, payment_status, order_status, coupon_code, note)
        VALUES
            (@new_order_code, @user_id, @receiver_name, @receiver_phone,
             @shipping_address_full, @subtotal, @subtotal,
             @payment_method, 'pending', 'pending', @coupon_code, @note);

        SET @new_bill_id = SCOPE_IDENTITY();

        -- Tạo bill_details và trừ tồn kho
        INSERT INTO orders.bill_details
            (bill_id, product_variant_id, product_name_snapshot,
             size_snapshot, color_snapshot, sku_snapshot,
             quantity, unit_price, total_price)
        SELECT
            @new_bill_id,
            pv.id,
            p.name,
            pv.size,
            pv.color,
            pv.sku,
            ci.quantity,
            ci.price_snapshot,
            ci.quantity * ci.price_snapshot
        FROM orders.cart_items ci
        INNER JOIN catalog.product_variants pv ON ci.product_variant_id = pv.id
        INNER JOIN catalog.products p          ON pv.product_id          = p.id
        WHERE ci.cart_id = @cart_id;

        -- Trừ tồn kho (trigger sẽ ghi inventory_transactions tự động)
        UPDATE pv
        SET pv.stock_quantity = pv.stock_quantity - ci.quantity
        FROM catalog.product_variants pv
        INNER JOIN orders.cart_items ci ON pv.id = ci.product_variant_id
        WHERE ci.cart_id = @cart_id;

        -- Tăng sold_count
        UPDATE p
        SET p.sold_count = p.sold_count + ci.quantity
        FROM catalog.products p
        INNER JOIN catalog.product_variants pv ON p.id = pv.product_id
        INNER JOIN orders.cart_items ci        ON pv.id = ci.product_variant_id
        WHERE ci.cart_id = @cart_id;

        -- Ghi log trạng thái đơn đầu tiên
        INSERT INTO orders.order_status_logs (bill_id, from_status, to_status, note, created_by)
        VALUES (@new_bill_id, NULL, 'pending', N'Đơn hàng vừa được tạo', @user_id);

        -- Xoá giỏ hàng sau khi đặt thành công
        DELETE FROM orders.cart_items WHERE cart_id = @cart_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP_2: Huỷ đơn hàng — hoàn tồn kho, cập nhật trạng thái
CREATE OR ALTER PROCEDURE orders.sp_CancelOrder
    @bill_id            BIGINT,
    @cancelled_by       BIGINT,
    @cancelled_reason   NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra trạng thái đơn
        DECLARE @current_status NVARCHAR(20);
        SELECT @current_status = order_status FROM orders.bills WHERE id = @bill_id;

        IF @current_status IS NULL
            RAISERROR(N'Đơn hàng không tồn tại.', 16, 1);

        IF @current_status IN ('delivered', 'cancelled')
            RAISERROR(N'Không thể huỷ đơn hàng ở trạng thái hiện tại.', 16, 1);

        -- Cập nhật trạng thái bill
        UPDATE orders.bills
        SET order_status     = 'cancelled',
            cancelled_reason = @cancelled_reason
        WHERE id = @bill_id;

        -- Ghi log trạng thái
        INSERT INTO orders.order_status_logs (bill_id, from_status, to_status, note, created_by)
        VALUES (@bill_id, @current_status, 'cancelled', @cancelled_reason, @cancelled_by);

        -- Hoàn tồn kho (trigger sẽ ghi inventory_transactions tự động)
        UPDATE pv
        SET pv.stock_quantity = pv.stock_quantity + bd.quantity
        FROM catalog.product_variants pv
        INNER JOIN orders.bill_details bd ON pv.id = bd.product_variant_id
        WHERE bd.bill_id = @bill_id;

        -- Giảm sold_count
        UPDATE p
        SET p.sold_count = p.sold_count - bd.quantity
        FROM catalog.products p
        INNER JOIN catalog.product_variants pv ON p.id = pv.product_id
        INNER JOIN orders.bill_details bd      ON pv.id = bd.product_variant_id
        WHERE bd.bill_id = @bill_id AND p.sold_count >= bd.quantity;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP_3: Duyệt / từ chối nhận xét
CREATE OR ALTER PROCEDURE reviews.sp_ModerateReview
    @review_id  BIGINT,
    @action     NVARCHAR(10),   -- 'approve' hoặc 'reject'
    @admin_id   BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF @action NOT IN ('approve', 'reject')
        RAISERROR(N'Action phải là "approve" hoặc "reject".', 16, 1);

    UPDATE reviews.reviews
    SET status = CASE WHEN @action = 'approve' THEN 'approved' ELSE 'rejected' END
    WHERE id = @review_id AND status = 'pending';

    IF @@ROWCOUNT = 0
        RAISERROR(N'Review không tồn tại hoặc đã được xử lý rồi.', 16, 1);

    -- Ghi audit log
    INSERT INTO auth.admin_logs (admin_id, action, target_table, target_id, new_value)
    VALUES (@admin_id, UPPER(@action) + '_REVIEW', 'reviews.reviews', @review_id,
            N'{"status":"' + CASE WHEN @action = 'approve' THEN 'approved' ELSE 'rejected' END + N'"}');
END;
GO

-- SP_4: Thống kê doanh thu theo khoảng thời gian
CREATE OR ALTER PROCEDURE operations.sp_RevenueReport
    @date_from  DATE,
    @date_to    DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CAST(b.created_at AS DATE)      AS order_date,
        COUNT(b.id)                     AS total_orders,
        SUM(b.total_amount)             AS total_revenue,
        AVG(b.total_amount)             AS avg_order_value,
        SUM(b.discount_amount)          AS total_discounts,
        SUM(b.shipping_fee)             AS total_shipping_fee
    FROM orders.bills b
    WHERE b.order_status    = 'delivered'
      AND CAST(b.created_at AS DATE) BETWEEN @date_from AND @date_to
    GROUP BY CAST(b.created_at AS DATE)
    ORDER BY order_date DESC;
END;
GO


-- ============================================================
-- VIEWS
-- ============================================================

-- VIEW_1: Sản phẩm với đánh giá trung bình và số lượng tồn kho tổng
CREATE OR ALTER VIEW catalog.vw_products_summary AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.base_price,
    p.thumbnail_url,
    p.is_featured,
    p.sold_count,
    pt.name                                         AS product_type_name,
    c.name                                          AS collection_name,
    COUNT(DISTINCT pv.id)                           AS variant_count,
    SUM(pv.stock_quantity)                          AS total_stock,
    MIN(ISNULL(pv.sale_price, pv.price))            AS min_price,
    MAX(ISNULL(pv.sale_price, pv.price))            AS max_price,
    COUNT(DISTINCT rv.id)                           AS review_count,
    CAST(AVG(CAST(rv.rating AS FLOAT)) AS DECIMAL(3,2)) AS avg_rating
FROM catalog.products p
INNER JOIN catalog.product_types pt     ON p.product_type_id = pt.id
LEFT  JOIN catalog.collections c        ON p.collection_id   = c.id
LEFT  JOIN catalog.product_variants pv  ON p.id = pv.product_id AND pv.is_active = 1
LEFT  JOIN reviews.reviews rv           ON p.id = rv.product_id AND rv.status = 'approved'
WHERE p.deleted_at IS NULL AND p.is_active = 1
GROUP BY p.id, p.name, p.slug, p.base_price, p.thumbnail_url,
         p.is_featured, p.sold_count, pt.name, c.name;
GO

-- VIEW_2: Đơn hàng kèm thông tin người dùng và thanh toán
CREATE OR ALTER VIEW orders.vw_bills_detail AS
SELECT
    b.id                AS bill_id,
    b.order_code,
    b.created_at        AS order_date,
    b.order_status,
    b.payment_status,
    b.payment_method,
    b.total_amount,
    b.discount_amount,
    b.shipping_fee,
    b.receiver_name,
    b.receiver_phone,
    u.email             AS customer_email,
    u.full_name         AS customer_name,
    COUNT(bd.id)        AS item_count,
    SUM(bd.quantity)    AS total_quantity,
    s.carrier           AS shipping_carrier,
    s.tracking_code,
    s.status            AS shipment_status
FROM orders.bills b
LEFT JOIN auth.users            u   ON b.user_id = u.id
LEFT JOIN orders.bill_details   bd  ON b.id = bd.bill_id
LEFT JOIN payment.shipments     s   ON b.id = s.bill_id
GROUP BY b.id, b.order_code, b.created_at, b.order_status, b.payment_status,
         b.payment_method, b.total_amount, b.discount_amount, b.shipping_fee,
         b.receiver_name, b.receiver_phone, u.email, u.full_name,
         s.carrier, s.tracking_code, s.status;
GO

-- VIEW_3: Top sản phẩm bán chạy
CREATE OR ALTER VIEW operations.vw_top_selling_products AS
SELECT TOP 100
    p.id,
    p.name,
    p.thumbnail_url,
    pt.name                     AS product_type,
    SUM(bd.quantity)            AS units_sold,
    SUM(bd.total_price)         AS revenue,
    COUNT(DISTINCT bd.bill_id)  AS order_count
FROM orders.bill_details bd
INNER JOIN catalog.product_variants pv  ON bd.product_variant_id = pv.id
INNER JOIN catalog.products p           ON pv.product_id = p.id
INNER JOIN catalog.product_types pt     ON p.product_type_id = pt.id
INNER JOIN orders.bills b               ON bd.bill_id = b.id
WHERE b.order_status = 'delivered'
GROUP BY p.id, p.name, p.thumbnail_url, pt.name
ORDER BY units_sold DESC;
GO

-- VIEW_4: Tồn kho sắp hết (cảnh báo)
CREATE OR ALTER VIEW operations.vw_low_stock_variants AS
SELECT
    pv.id           AS variant_id,
    pv.sku,
    pv.size,
    pv.color,
    pv.stock_quantity,
    p.id            AS product_id,
    p.name          AS product_name,
    p.thumbnail_url
FROM catalog.product_variants pv
INNER JOIN catalog.products p ON pv.product_id = p.id
WHERE pv.stock_quantity <= 5
  AND pv.is_active = 1
  AND p.deleted_at IS NULL;
GO

PRINT N'✅ ECommerceDB DDL hoàn tất: 32 bảng, 7 schema, index, trigger, stored procedure, view.';
GO
