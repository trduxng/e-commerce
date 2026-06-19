# 🗺️ Sơ đồ Luồng Toàn bộ Hệ thống BaseCore E-Commerce

---

## 1. Kiến trúc Tổng quan Hệ thống

```mermaid
graph TB
    subgraph "🌐 Frontend - React SPA"
        Client["React + Vite<br/>Port 5173"]
        Auth_UI["AuthContext<br/>CartContext<br/>FavoriteContext"]
        Guard["ProtectedRoute<br/>Route Guard"]
        Axios["Axios Client<br/>Interceptor + Retry"]
    end

    subgraph "🚪 API Gateway"
        Gateway["Ocelot Gateway<br/>Port 5000<br/>ocelot.json routing<br/>CORS Policy"]
    end

    subgraph "🔐 Auth Microservice"
        AuthSvc["AuthService<br/>Port 5003"]
        AuthCtrl["AuthController<br/>/api/auth/login<br/>/api/auth/register"]
        UserCtrl["UsersController<br/>/api/users/*"]
        JWT["JWT Token Generator<br/>HmacSha256<br/>Claims: ID, Email, Role"]
    end

    subgraph "🏪 Business Microservice"
        APISvc["APIService<br/>Port 5001"]
        ProdCtrl["ProductsController"]
        CartCtrl["CartController"]
        OrderCtrl["OrdersController"]
        CatCtrl["CategoriesController"]
        CouponCtrl["CouponsController"]
        ReviewCtrl["ReviewsController"]
        AddrCtrl["AddressesController"]
        MfgCtrl["ManufacturersController"]
    end

    subgraph "📚 Shared Libraries"
        Entities["BaseCore.Entities<br/>Entity Models"]
        Repo["BaseCore.Repository<br/>EF Core + DbContext"]
        Services["BaseCore.Services<br/>Business Logic"]
        Common["BaseCore.Common<br/>JWT Helpers, Constants"]
        DTO["BaseCore.DTO<br/>Data Transfer Objects"]
    end

    subgraph "🗄️ Database"
        DB[("SQL Server<br/>4 Schemas:<br/>auth | catalog<br/>orders | sales")]
    end

    subgraph "📝 Logging"
        LogSvc["LogService<br/>AuditLog"]
    end

    Client --> Auth_UI
    Auth_UI --> Guard
    Guard --> Axios
    Axios -->|"HTTP Request<br/>+ Bearer Token"| Gateway

    Gateway -->|"/api/auth/*<br/>/api/users/*"| AuthSvc
    Gateway -->|"/api/products/*<br/>/api/orders/*<br/>/api/cart/*<br/>..."| APISvc

    AuthSvc --> AuthCtrl
    AuthSvc --> UserCtrl
    AuthCtrl --> JWT

    APISvc --> ProdCtrl
    APISvc --> CartCtrl
    APISvc --> OrderCtrl
    APISvc --> CatCtrl
    APISvc --> CouponCtrl
    APISvc --> ReviewCtrl
    APISvc --> AddrCtrl
    APISvc --> MfgCtrl

    AuthSvc -->|EF Core| Repo
    APISvc -->|EF Core| Repo
    Repo --> Entities
    APISvc --> Services
    Services --> Common
    APISvc --> DTO

    Repo -->|"SQLServerDbContext"| DB
    APISvc -.->|Log| LogSvc
```

---

## 2. Luồng Xác thực & Phân quyền (JWT + RBAC)

```mermaid
sequenceDiagram
    actor User as 👤 Người dùng
    participant React as 🌐 React App
    participant Axios as 📡 Axios Interceptor
    participant GW as 🚪 Gateway :5000
    participant Auth as 🔐 AuthService :5003
    participant DB as 🗄️ SQL Server

    Note over User, DB: === ĐĂNG NHẬP ===
    User->>React: Nhập Email + Password
    React->>Axios: POST /api/auth/login
    Axios->>GW: Forward request
    GW->>Auth: Route → /api/auth/login
    Auth->>DB: SELECT * FROM auth.users WHERE email = ?
    DB-->>Auth: User record
    
    alt Credentials hợp lệ
        Auth->>Auth: Tạo JWT Token<br/>Claims: {ID, Email, Role}
        Auth-->>GW: 200 OK + {token, user}
        GW-->>Axios: Response
        Axios-->>React: Lưu token + user
        React->>React: localStorage.setItem("token")<br/>AuthContext.setUser()
    else Sai mật khẩu
        Auth-->>GW: 401 Unauthorized
        GW-->>React: Hiển thị lỗi
    end

    Note over User, DB: === REQUEST CÓ XÁC THỰC ===
    User->>React: Truy cập trang Admin
    React->>React: ProtectedRoute kiểm tra<br/>role === "admin" ?
    
    alt Đủ quyền
        React->>Axios: GET /api/products
        Axios->>Axios: Interceptor tự gắn<br/>Authorization: Bearer {token}
        Axios->>GW: Request + Header
        GW->>Auth: Validate JWT
        Auth-->>GW: Token hợp lệ
        GW->>React: Forward response
    else Không đủ quyền
        React->>React: Navigate → "/"
    end

    Note over User, DB: === TOKEN HẾT HẠN ===
    Axios->>GW: Request với token cũ
    GW-->>Axios: 401 Unauthorized
    Axios->>Axios: Response Interceptor bắt 401
    Axios->>React: Xóa token + Redirect /login
```

---

## 3. Luồng Mua hàng & Đặt hàng (Cart → Checkout → Order)

```mermaid
sequenceDiagram
    actor Cust as 🛒 Khách hàng
    participant Shop as 🌐 Shop.jsx
    participant Detail as 📦 ProductDetail.jsx
    participant Cart as 🛍️ Cart Page
    participant Checkout as 💳 Checkout.jsx
    participant GW as 🚪 Gateway :5000
    participant API as 🏪 APIService :5001
    participant DB as 🗄️ SQL Server

    Note over Cust, DB: === DUYỆT & THÊM GIỎ HÀNG ===
    Cust->>Shop: Duyệt sản phẩm
    Shop->>GW: GET /api/products
    GW->>API: ProductsController.GetAll()
    API->>DB: SELECT FROM catalog.products
    DB-->>API: Danh sách sản phẩm
    API-->>Shop: Response JSON

    Cust->>Detail: Click xem chi tiết
    Detail->>GW: GET /api/products/{id}
    GW->>API: Lấy product + variants + reviews
    API-->>Detail: Thông tin đầy đủ

    Cust->>Detail: Click "Thêm vào giỏ"
    Detail->>GW: POST /api/cart/items<br/>{productVariantId, quantity}
    GW->>API: CartController.AddItem()
    API->>DB: INSERT INTO orders.cart_items<br/>(+ snapshot giá, tên, SKU)
    DB-->>API: OK
    API-->>Detail: Giỏ hàng cập nhật
    Detail->>Detail: CartContext.updateCount()

    Note over Cust, DB: === CHECKOUT ===
    Cust->>Cart: Xem giỏ hàng
    Cart->>GW: GET /api/cart
    GW->>API: Lấy cart + cart_items
    API-->>Cart: Danh sách sản phẩm trong giỏ

    Cust->>Checkout: Tiến hành thanh toán
    Checkout->>GW: GET /api/addresses<br/>Lấy địa chỉ giao hàng
    GW->>API: AddressesController
    API-->>Checkout: Danh sách địa chỉ

    Cust->>Checkout: Nhập mã giảm giá
    Checkout->>GW: POST /api/coupons/apply<br/>{code, orderValue}
    GW->>API: CouponsController.Apply()
    API->>DB: Kiểm tra coupon hợp lệ<br/>(hạn dùng, min_order_value, usage_limit)
    API-->>Checkout: Số tiền giảm

    Cust->>Checkout: Click "Đặt hàng"
    Checkout->>GW: POST /api/orders
    GW->>API: OrdersController.Create()
    
    Note over API, DB: 🔒 BEGIN TRANSACTION (Atomic)
    API->>DB: 1. Kiểm tra tồn kho ProductVariants
    API->>DB: 2. INSERT INTO orders.bills<br/>(order_code, subtotal, total...)
    API->>DB: 3. INSERT INTO orders.bill_details<br/>(snapshot: tên, giá, SKU, size, color)
    API->>DB: 4. UPDATE stock_quantity -= quantity
    API->>DB: 5. DELETE FROM orders.cart_items
    
    alt Thành công
        API->>DB: ✅ COMMIT TRANSACTION
        API-->>Checkout: {orderCode: "ORD-XXXX"}
        Checkout->>Checkout: 🎉 Hiển thị đặt hàng thành công
    else Lỗi (hết hàng, etc.)
        API->>DB: ❌ ROLLBACK TRANSACTION
        API-->>Checkout: 400 Bad Request
        Checkout->>Checkout: Hiển thị lỗi
    end
```

---

## 4. Luồng Thanh toán & Xử lý Đơn hàng

```mermaid
stateDiagram-v2
    [*] --> Pending: Khách đặt hàng

    Pending --> Confirmed: Admin xác nhận
    Pending --> Cancelled: Admin/Khách hủy

    Confirmed --> Shipping: Giao cho vận chuyển
    Confirmed --> Cancelled: Admin hủy

    Shipping --> Delivered: Giao thành công

    Delivered --> ReturnRequested: Khách yêu cầu đổi trả

    ReturnRequested --> Returned: Admin chấp nhận
    ReturnRequested --> ReturnRejected: Admin từ chối

    Returned --> Refunded: Hoàn tiền

    Cancelled --> [*]
    ReturnRejected --> [*]
    Refunded --> [*]
    Delivered --> [*]

    note right of Pending
        PaymentStatus: Pending
        Phương thức: COD/VNPAY/MoMo/PayPal
    end note

    note right of Delivered
        PaymentStatus → Paid
        Mở quyền đánh giá sản phẩm
    end note
```

---

## 5. Luồng Đổi trả Sản phẩm (RMA Flow)

```mermaid
sequenceDiagram
    actor Cust as 👤 Khách hàng
    participant MyOrders as 📋 MyOrders.jsx
    participant Returns as 🔄 Returns.jsx
    participant GW as 🚪 Gateway
    participant API as 🏪 APIService
    participant Admin as 👨‍💼 Admin Panel
    participant DB as 🗄️ SQL Server

    Cust->>MyOrders: Xem đơn đã giao (Delivered)
    Cust->>Returns: Click "Yêu cầu đổi trả"
    Returns->>GW: POST /api/orders/{id}/request-return<br/>{reason, quantity}
    GW->>API: OrdersController
    API->>DB: UPDATE bills SET order_status = 'return_requested'
    API-->>Returns: Yêu cầu đã gửi

    Admin->>Admin: Xem danh sách yêu cầu đổi trả
    Admin->>GW: PUT /api/orders/{id}/return-decision<br/>{decision: "approve" | "reject"}
    GW->>API: Xử lý quyết định

    alt Chấp nhận
        API->>DB: UPDATE order_status = 'returned'
        API->>DB: Hoàn lại stock_quantity
        API-->>Admin: ✅ Đã chấp nhận
        Note over API, DB: Tiếp tục → Refunded
    else Từ chối
        API->>DB: UPDATE order_status = 'return_rejected'
        API-->>Admin: ❌ Đã từ chối
    end
```

---

## 6. Luồng Quản trị Admin (Admin Dashboard)

```mermaid
graph LR
    subgraph "👨‍💼 Admin Dashboard"
        Dashboard["📊 Dashboard<br/>Biểu đồ doanh thu<br/>Thống kê đơn hàng"]
    end

    subgraph "📦 Quản lý Catalog"
        Products["Products<br/>CRUD Sản phẩm<br/>+ Variants"]
        Categories["Categories<br/>Danh mục cha-con"]
        Manufacturers["Manufacturers<br/>Nhà sản xuất"]
        SpecAttrs["Spec Attributes<br/>Thuộc tính kỹ thuật"]
    end

    subgraph "🛒 Quản lý Bán hàng"
        Orders["Orders<br/>Duyệt/Hủy đơn<br/>Xuất PDF/Excel"]
        Coupons["Coupons<br/>Mã giảm giá"]
        CurrentCarts["Current Carts<br/>Giám sát giỏ hàng<br/>real-time"]
        CheckoutAttrs["Checkout Attrs<br/>Gói quà, phụ phí"]
    end

    subgraph "👥 Quản lý Hệ thống"
        Users["Users<br/>RBAC phân quyền"]
        Reviews["Reviews<br/>Duyệt đánh giá"]
        Revenue["Revenue<br/>Báo cáo doanh thu"]
    end

    Dashboard --> Products
    Dashboard --> Orders
    Dashboard --> Users
    Dashboard --> Revenue

    Products --> Categories
    Products --> Manufacturers
    Products --> SpecAttrs

    Orders --> Coupons
    Orders --> CurrentCarts
    Orders --> CheckoutAttrs
```

---

## 7. Sơ đồ Quan hệ Database (ER Diagram)

```mermaid
erDiagram
    %% Schema: auth
    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        string status
        datetime created_at
    }

    USER_ADDRESSES {
        int id PK
        int user_id FK
        string receiver_name
        string phone
        string province
        string district
        string ward
        string address_detail
        bool is_default
    }

    %% Schema: catalog
    CATEGORIES {
        int id PK
        string name
        int parent_id FK
        string description
    }

    MANUFACTURERS {
        int id PK
        string name
        string description
    }

    PRODUCTS {
        int id PK
        string name
        string slug UK
        decimal base_price
        string thumbnail_url
        int product_type_id FK
        int manufacturer_id FK
        int sold_count
        int view_count
        bool is_featured
    }

    PRODUCT_VARIANTS {
        int id PK
        int product_id FK
        string size
        string color
        string sku UK
        decimal price
        decimal sale_price
        int stock_quantity
    }

    FAVORITE_PRODUCTS {
        int user_id FK
        int product_id FK
    }

    PRODUCT_REVIEWS {
        int id PK
        int user_id FK
        int product_id FK
        int rating
        string comment
        bool is_approved
    }

    PRODUCT_SPECIFICATIONS {
        int id PK
        int product_id FK
        int spec_attr_id FK
        string value
    }

    %% Schema: orders
    CARTS {
        int id PK
        int user_id FK
        datetime created_date
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int product_variant_id FK
        int quantity
        decimal price_snapshot
        string product_name_snapshot
    }

    ORDERS {
        int id PK
        string order_code UK
        int user_id FK
        string shipping_address_full
        decimal subtotal
        decimal shipping_fee
        decimal discount_amount
        decimal total_amount
        string payment_method
        string payment_status
        string order_status
        datetime created
    }

    ORDER_DETAILS {
        int id PK
        int order_id FK
        int product_variant_id FK
        int quantity
        decimal unit_price
        string product_name_snapshot
        string sku_snapshot
        string size_snapshot
        string color_snapshot
    }

    %% Schema: sales
    COUPONS {
        int id PK
        string code UK
        string type
        decimal value
        decimal min_order_value
        int usage_limit
        int used_count
        datetime start_date
        datetime end_date
        bool is_active
    }

    CHECKOUT_ATTRIBUTES {
        int id PK
        string name
    }

    CHECKOUT_ATTRIBUTE_VALUES {
        int id PK
        int attribute_id FK
        string name
        decimal price_adjustment
    }

    %% Relationships
    USERS ||--o{ USER_ADDRESSES : "có nhiều"
    USERS ||--o| CARTS : "sở hữu"
    USERS ||--o{ ORDERS : "đặt"
    USERS ||--o{ FAVORITE_PRODUCTS : "yêu thích"
    USERS ||--o{ PRODUCT_REVIEWS : "đánh giá"

    CATEGORIES ||--o{ PRODUCTS : "chứa"
    CATEGORIES ||--o{ CATEGORIES : "cha-con"
    MANUFACTURERS ||--o{ PRODUCTS : "sản xuất"

    PRODUCTS ||--o{ PRODUCT_VARIANTS : "có biến thể"
    PRODUCTS ||--o{ FAVORITE_PRODUCTS : "được thích"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "nhận đánh giá"
    PRODUCTS ||--o{ PRODUCT_SPECIFICATIONS : "có thông số"

    CARTS ||--o{ CART_ITEMS : "chứa"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "trong giỏ"
    PRODUCT_VARIANTS ||--o{ ORDER_DETAILS : "được mua"

    ORDERS ||--o{ ORDER_DETAILS : "chi tiết"

    CHECKOUT_ATTRIBUTES ||--o{ CHECKOUT_ATTRIBUTE_VALUES : "giá trị"
```

---

## 8. Luồng Dữ liệu End-to-End (Data Flow)

```mermaid
graph TB
    subgraph "Layer 1: Presentation"
        A1["React Components<br/>JSX + Bootstrap 5"]
        A2["Context Providers<br/>Auth/Cart/Favorite"]
        A3["Route Guards<br/>ProtectedRoute"]
    end

    subgraph "Layer 2: API Communication"
        B1["Axios Instance<br/>baseURL: localhost:5000"]
        B2["Request Interceptor<br/>Auto-attach JWT"]
        B3["Response Interceptor<br/>401 → Redirect<br/>5xx → Retry x2"]
    end

    subgraph "Layer 3: API Gateway"
        C1["Ocelot Gateway :5000<br/>ocelot.json<br/>CORS + Routing"]
    end

    subgraph "Layer 4: Microservices"
        D1["AuthService :5003<br/>Login/Register/JWT"]
        D2["APIService :5001<br/>Products/Orders/Cart<br/>Coupons/Reviews"]
    end

    subgraph "Layer 5: Business Logic"
        E1["Repository Pattern<br/>Interface → Implementation"]
        E2["Services Layer<br/>Business Logic"]
        E3["DTO Mapping<br/>Entity ↔ Response"]
    end

    subgraph "Layer 6: Data Access"
        F1["EF Core 8<br/>SQLServerDbContext"]
        F2["Fluent API<br/>Schema Mapping<br/>Constraints + Indexes"]
        F3["Migrations<br/>Code-First"]
    end

    subgraph "Layer 7: Database"
        G1[("SQL Server<br/>auth | catalog<br/>orders | sales")]
    end

    A1 --> A2 --> A3
    A3 --> B1 --> B2 --> B3
    B3 --> C1
    C1 --> D1
    C1 --> D2
    D1 --> E1
    D2 --> E1
    D2 --> E2
    E2 --> E3
    E1 --> F1
    F1 --> F2 --> F3
    F3 --> G1
```

---

> [!TIP]
> Các diagram trên sử dụng cú pháp **Mermaid** — có thể render trực tiếp trên GitHub, GitLab, Notion, hoặc các Markdown viewer hỗ trợ Mermaid.
