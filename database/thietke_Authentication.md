Đây là câu hỏi về **thiết kế xác thực (Authentication)** và **lý do dùng single-table cho tất cả loại user**. Không cần tìm kiếm vì đây là kiến thức kiến trúc hệ thống.

***

## Hệ Thống Nhận Biết Người Dùng Như Thế Nào?

### Cơ chế: JWT (JSON Web Token)

Đây là cách phổ biến nhất cho REST API / Node.js backend:

```
① Đăng nhập
   Client gửi: { email, password }
        ↓
   Server kiểm tra password_hash (Bcrypt)
        ↓
   Tạo JWT chứa payload:
   {
     "sub": 42,            ← users.id
     "role": "customer",   ← users.role
     "status": "active",   ← users.status
     "iat": 1714000000,    ← issued at
     "exp": 1714086400     ← hết hạn sau 24h
   }
        ↓
   Trả về: { access_token: "eyJ...", expires_in: 86400 }

② Mỗi request tiếp theo
   Header: Authorization: Bearer eyJ...
        ↓
   Server decode JWT → lấy sub = 42
        ↓
   Biết ngay đây là users.id = 42
   KHÔNG cần query database mỗi lần
```

> **JWT là "thẻ căn cước tự xác minh"** — server ký bằng secret key, khi nhận lại chỉ cần verify chữ ký, không cần tra DB.

***

## Tại Sao Không Tách Bảng `customers` và `admins` Riêng?

Đây là câu hỏi thiết kế rất hay, có **2 trường phái**:

### ❌ Trường phái tách bảng (Single Table per Role)

```sql
-- Một số hệ thống cũ làm thế này
CREATE TABLE customers (id, email, password_hash, ...)
CREATE TABLE admins    (id, email, password_hash, ...)
CREATE TABLE staff     (id, email, password_hash, ...)
```

**Vấn đề phát sinh:**

| Vấn đề | Hậu quả |
|---|---|
| Lặp code xác thực 3 lần | Bug fix phải sửa 3 chỗ |
| Không thể 1 người vừa là staff vừa là customer | Phải tạo 2 tài khoản riêng |
| JOIN phức tạp | `bills` phải FK vào cả 3 bảng |
| Email trùng giữa các bảng | Admin có thể đăng ký lại thành customer |
| Khó thêm role mới | Phải tạo bảng mới và sửa toàn bộ code |

***

### ✅ Trường phái Single Table + Role Column (Thiết kế hiện tại)

```sql
-- Tất cả vào 1 bảng, phân biệt bằng cột role
auth.users (id, email, password_hash, role, status, ...)
```

**Lý do thiết kế này đúng:**

#### 1. Danh tính là 1, vai trò có thể thay đổi
```
Một email = một người duy nhất trong hệ thống
Người đó có thể được nâng quyền staff/admin bất cứ lúc nào
→ Chỉ cần UPDATE users SET role='staff' WHERE id=42
→ Không cần tạo tài khoản mới
```

#### 2. Mọi quan hệ chỉ cần 1 FK
```sql
-- bills chỉ cần 1 dòng FK thay vì 3
user_id  BIGINT FK → auth.users(id)   ✅ đơn giản

-- Nếu tách bảng phải làm thế này:
customer_id  BIGINT FK → customers(id) NULL
admin_id     BIGINT FK → admins(id)    NULL
staff_id     BIGINT FK → staff(id)     NULL
-- → Phức tạp, dễ sai, query JOIN rối
```

#### 3. Logic xác thực viết 1 lần
```javascript
// Middleware kiểm tra quyền — chỉ 1 đoạn code
function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;            // lấy từ JWT
    if (user.role !== role)
      return res.status(403).json({ error: 'Forbidden' });
    next();
  }
}

// Dùng cho mọi route
router.delete('/products/:id', requireRole('admin'), deleteProduct);
router.patch('/orders/:id',    requireRole('staff'),  updateOrder);
```

#### 4. Audit trail đơn giản
```sql
-- admin_logs chỉ cần 1 FK duy nhất
admin_id  BIGINT FK → auth.users(id)
-- Biết ngay ai làm gì dù họ là admin hay staff
```

***

## Phân Quyền Hoạt Động Thực Tế

```
Mỗi API endpoint kiểm tra 2 thứ từ JWT:

1. Authenticated?  → token hợp lệ, chưa hết hạn
2. Authorized?     → role có đủ quyền không?

Ví dụ:

GET  /products          → Tất cả (không cần token)
POST /products          → Chỉ role='admin'
GET  /orders            → role='admin' hoặc 'staff'
GET  /orders/my         → role='customer' (chỉ xem đơn của mình)
DELETE /users/:id       → Chỉ role='admin'
```

***

## Khi Nào Nên Tách Bảng?

Chỉ tách khi 2 loại user có **cấu trúc dữ liệu hoàn toàn khác nhau**:

```
Ví dụ: Hệ thống Marketplace (sàn TMĐT như Shopee)
  → users      (người mua — địa chỉ, lịch sử mua)
  → merchants  (người bán — giấy phép kinh doanh, tài khoản ngân hàng, cửa hàng)

→ 2 bảng riêng vì merchant có hàng chục cột đặc thù
  mà customer không bao giờ có
```

**Với hệ thống của bạn** (1 shop bán hàng, không phải marketplace), tất cả user đều dùng chung email/mật khẩu/địa chỉ → **1 bảng là đúng**.