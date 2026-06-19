# Bản đồ code BaseCore E-Commerce

Tài liệu này dùng để:

- Tìm nhanh file khi được hỏi về code.
- Giải thích luồng chạy từ giao diện đến database.
- Chuẩn bị trả lời bảo vệ đồ án hoặc phỏng vấn.
- Xác định nơi cần sửa khi có lỗi.

## 1. Sơ đồ tổng quát

```text
Người dùng
    |
    v
React WebClient :3000
    |
    | Axios gọi /api/*
    v
API Gateway :5000
    |
    +----------------------+
    |                      |
    v                      v
AuthService :5003     APIService :5001
    |                      |
    +----------+-----------+
               |
               v
       Repository + EF Core
               |
               v
          SQL Server
```

Luồng chuẩn khi giải thích một chức năng:

```text
Page/Component
  -> services/api.js
  -> API Gateway
  -> Controller
  -> Repository hoặc DbContext
  -> Entity
  -> SQL Server
```

## 2. Vai trò từng project

| Project | Vai trò | File nên nhớ |
|---|---|---|
| `BaseCore.WebClient` | React frontend cho khách hàng và admin | `src/App.jsx`, `src/services/api.js` |
| `BaseCore.ApiGateway` | Chuyển tiếp request `/api/*` đến đúng service | `Program.cs`, `ocelot.json` |
| `BaseCore.APIService` | API sản phẩm, giỏ hàng, đơn hàng, coupon... | `Controllers/`, `Program.cs` |
| `BaseCore.AuthService` | Đăng nhập, đăng ký, user và role | `Controllers/AuthController.cs` |
| `BaseCore.Entities` | Các entity ánh xạ dữ liệu | `Product.cs`, `Order.cs`, `Cart.cs` |
| `BaseCore.Repository` | EF Core, repository, migration, seed dữ liệu | `SQLServerDbContext.cs`, `EFCore/` |
| `BaseCore.Services` | Một số service nghiệp vụ cũ/phụ trợ | `ProductService.cs`, `OrderService.cs` |
| `BaseCore.UnitTest` | Test nghiệp vụ | `CartCheckoutTests.cs`, `OrderCalculationTests.cs` |
| `database` | Script và bản xuất dữ liệu SQL | Các file `.sql` |
| `document` | Tài liệu hệ thống | File hiện tại và các tài liệu kiến trúc |

Lưu ý: luồng API chính hiện nay thường gọi repository hoặc `SQLServerDbContext`
trực tiếp trong controller. Không phải mọi chức năng đều đi qua
`BaseCore.Services`.

## 3. Điểm bắt đầu của hệ thống

### Frontend

File:

```text
BaseCore.WebClient/src/App.jsx
```

Nhiệm vụ:

- Khai báo route.
- Phân chia public, customer và admin.
- Bọc toàn hệ thống bằng các context/provider.
- Lazy load các trang.

Nhóm route quan trọng:

```text
/                         Trang chủ
/shop                     Danh sách sản phẩm
/product/:id              Chi tiết sản phẩm
/cart                     Giỏ hàng
/checkout                 Thanh toán
/my-orders                Đơn hàng của khách
/admin/products           Quản lý sản phẩm
/admin/orders             Quản lý đơn hàng
/admin/users              Quản lý người dùng
```

### Backend API

File:

```text
BaseCore.APIService/Program.cs
```

Nhiệm vụ:

- Đăng ký `SQLServerDbContext`.
- Đăng ký dependency injection cho repository.
- Cấu hình JWT authentication.
- Chạy migration/seed thông qua `DbInitializer`.
- Map các controller.

### API Gateway

File:

```text
BaseCore.ApiGateway/ocelot.json
```

Ví dụ:

```text
/api/products/* -> APIService cổng 5001
/api/orders/*   -> APIService cổng 5001
/api/auth/*     -> AuthService cổng 5003
/api/users/*    -> AuthService cổng 5003
```

## 4. Bản đồ frontend

### Route và layout

```text
src/App.jsx
src/components/ShopLayout.jsx
src/components/AdminLayout.jsx
src/components/ProtectedRoute.jsx
```

`ProtectedRoute` kiểm tra:

- Người dùng đã đăng nhập chưa.
- Route admin có đúng quyền staff/admin không.

### Context

| File | Quản lý |
|---|---|
| `contexts/AuthContext.jsx` | Token, user, đăng nhập, đăng xuất |
| `contexts/CartContext.jsx` | Giỏ hàng, chọn dòng checkout, tổng tiền |
| `contexts/FavoriteContext.jsx` | Sản phẩm yêu thích |
| `contexts/ToastContext.jsx` | Thông báo |
| `contexts/ThemeContext.jsx` | Giao diện sáng/tối |
| `contexts/SettingsContext.jsx` | Cấu hình website |

### Nơi tập trung lời gọi API

```text
BaseCore.WebClient/src/services/api.js
```

Ví dụ:

```javascript
productApi.search(params)
productApi.create(data)
productApi.uploadImage(file)
cartApi.addItem(data)
cartApi.checkout(data)
orderApi.create(data)
orderApi.cancel(id)
```

Axios interceptor tự gắn JWT:

```text
Authorization: Bearer <token>
```

### Các trang khách hàng

| Trang | File |
|---|---|
| Trang chủ | `pages/Home.jsx` |
| Danh sách sản phẩm | `pages/Shop.jsx` |
| Chi tiết sản phẩm | `pages/ProductDetail.jsx` |
| Giỏ hàng | `pages/Cart.jsx` |
| Thanh toán | `pages/Checkout.jsx` |
| Đơn hàng cá nhân | `pages/MyOrders.jsx` |
| Tài khoản | `pages/Account.jsx` |
| Yêu thích | `pages/Favorites.jsx` |

### Các trang admin

| Chức năng | File |
|---|---|
| Dashboard | `pages/Dashboard.jsx` |
| Sản phẩm | `pages/Products.jsx` |
| Danh mục | `pages/Categories.jsx` |
| Đơn hàng | `pages/Orders.jsx` |
| Doanh thu | `pages/Revenue.jsx` |
| Người dùng | `pages/Users.jsx` |
| Đánh giá | `pages/Reviews.jsx` |
| Coupon | `pages/Coupons.jsx` |
| Thương hiệu | `pages/Manufacturers.jsx` |
| Thuộc tính kỹ thuật | `pages/SpecificationAttributes.jsx` |
| Thuộc tính checkout | `pages/CheckoutAttributes.jsx` |

## 5. Bản đồ backend

### Controller chính

| Controller | Chức năng |
|---|---|
| `ProductsController.cs` | CRUD, tìm kiếm, variant, review, upload ảnh |
| `CategoriesController.cs` | CRUD danh mục |
| `CartController.cs` | Thêm/sửa/xóa giỏ và checkout |
| `OrdersController.cs` | Tạo, xem, hủy, cập nhật, trả hàng |
| `CouponsController.cs` | CRUD và áp dụng mã giảm giá |
| `FavoritesController.cs` | Sản phẩm yêu thích |
| `AddressesController.cs` | Sổ địa chỉ |
| `ReviewsController.cs` | Admin duyệt đánh giá |
| `ManufacturersController.cs` | Quản lý thương hiệu |
| `AccountController.cs` | Hồ sơ và dashboard khách hàng |

### Repository

| File | Vai trò |
|---|---|
| `EFCore/Repository.cs` | CRUD dùng chung |
| `EFCore/ProductRepository.cs` | Tìm kiếm/lọc/sắp xếp sản phẩm |
| `EFCore/OrderRepository.cs` | Truy vấn và báo cáo đơn hàng |
| `EFCore/CategoryRepository.cs` | Truy vấn danh mục |
| `Authen/UserRepository.cs` | Truy vấn tài khoản |

### DbContext

```text
BaseCore.Repository/SQLServerDbContext.cs
```

File này chứa:

- `DbSet`.
- Tên bảng và schema.
- Kiểu dữ liệu cột.
- Quan hệ khóa ngoại.
- Unique index.
- Check constraint.

Một số ràng buộc đáng nhớ:

```text
ProductVariant.Sku                    UNIQUE
Cart.UserId                           UNIQUE
(CartItem.CartId, ProductVariantId)   UNIQUE
Order.OrderCode                       UNIQUE
```

## 6. Các entity quan trọng

```text
Product
  1 ---- n ProductVariant

Cart
  1 ---- n CartItem
CartItem
  n ---- 1 ProductVariant

Order
  1 ---- n OrderDetail
OrderDetail
  n ---- 1 ProductVariant
```

### Product

File:

```text
BaseCore.Entities/Product.cs
BaseCore.Entities/ProductVariant.cs
```

`Product` lưu thông tin chung:

- Tên.
- Mô tả.
- Danh mục.
- Thương hiệu.
- Ảnh chung.
- Trạng thái.
- Số lượng đã bán.

`ProductVariant` lưu:

- Size.
- Màu.
- SKU.
- Giá.
- Giá khuyến mãi.
- Tồn kho.
- Ảnh riêng.

### Cart

File:

```text
BaseCore.Entities/Cart.cs
BaseCore.Entities/CartItem.cs
```

`CartItem` lưu snapshot giá, tên, SKU, size, màu và ảnh tại thời điểm thêm
vào giỏ.

### Order

File:

```text
BaseCore.Entities/Order.cs
BaseCore.Entities/OrderDetail.cs
```

`OrderDetail` lưu snapshot để lịch sử đơn hàng không bị thay đổi khi catalog
được sửa sau này.

## 7. Luồng tìm kiếm sản phẩm

```text
Topbar.jsx
  -> chuyển đến /shop?keyword=...
  -> Shop.jsx đọc keyword
  -> productApi.search(...)
  -> GET /api/products
  -> ProductsController.GetAll()
  -> ProductRepository.SearchAsync()
  -> SQL Server
```

File quan trọng:

```text
BaseCore.WebClient/src/components/layout/Topbar.jsx
BaseCore.WebClient/src/pages/Shop.jsx
BaseCore.WebClient/src/services/api.js
BaseCore.APIService/Controllers/ProductsController.cs
BaseCore.Repository/EFCore/ProductRepository.cs
```

Hiện tại tìm kiếm theo `keyword` chỉ khớp tên sản phẩm:

```csharp
p.Name.ToLower().Contains(keyword)
```

Điều kiện tìm theo `Description` đã được comment.

Nhánh dữ liệu mẫu trong `Shop.jsx` cũng chỉ tìm theo `product.name`.

### Câu hỏi thường gặp

**Hỏi:** Tại sao không lọc trực tiếp toàn bộ dữ liệu ở React?

**Trả lời:** Dữ liệu thật được lọc và phân trang ở database để không phải tải
toàn bộ sản phẩm về trình duyệt. Frontend chỉ gửi tham số và hiển thị trang
kết quả hiện tại.

## 8. Luồng lọc sản phẩm theo khoảng giá ở admin

```text
Products.jsx
  -> state minPrice, maxPrice
  -> productApi.search({ minPrice, maxPrice })
  -> ProductsController.GetAll()
  -> ProductRepository.SearchAsync()
```

Backend lọc theo giá thấp nhất của variant:

```csharp
p.ProductVariants.Min(v => v.SalePrice ?? v.Price)
```

Nếu sản phẩm không có variant thì dùng `Product.BasePrice`.

Frontend kiểm tra:

```text
minPrice không được lớn hơn maxPrice
```

File cần mở khi được hỏi:

```text
BaseCore.WebClient/src/pages/Products.jsx
BaseCore.APIService/Controllers/ProductsController.cs
BaseCore.Repository/EFCore/ProductRepository.cs
```

## 9. Luồng quản lý sản phẩm và variant

```text
Admin nhập form Products.jsx
  -> chuẩn hóa variants
  -> productApi.create() hoặc productApi.update()
  -> ProductsController
  -> kiểm tra category, SKU, variant
  -> ProductRepository
  -> SaveChanges
```

Mỗi variant có thể có:

- SKU riêng.
- Giá gốc.
- Giá khuyến mãi.
- Tồn kho.
- Size.
- Màu.
- Ảnh riêng.

SKU có unique index. Nếu hai variant dùng cùng SKU, SQL Server trả lỗi:

```text
Violation of UNIQUE KEY constraint UQ_product_variants_sku
```

## 10. Luồng upload ảnh variant

```text
Products.jsx
  -> chọn file bằng input type="file"
  -> productApi.uploadImage(file)
  -> POST /api/products/upload-image
  -> ProductsController.UploadImage()
  -> lưu vào BaseCore.APIService/wwwroot/uploads/products
  -> trả URL /api/products/images/{fileName}
  -> gắn URL vào variant.imageUrl
```

Endpoint xem ảnh:

```text
GET /api/products/images/{fileName}
```

Quy tắc:

- Chấp nhận JPG, JPEG, PNG, WEBP.
- Tối đa 5 MB.
- Tên file được đổi thành GUID để tránh trùng.
- Chỉ Admin/Manager được upload.

File cần mở:

```text
BaseCore.WebClient/src/pages/Products.jsx
BaseCore.WebClient/src/services/api.js
BaseCore.APIService/Controllers/ProductsController.cs
```

Lưu ý: nút duyệt ảnh chính của sản phẩm trước đây chỉ gán
`/img/{file.name}`. Upload variant hiện đã dùng endpoint upload thật.

## 11. Luồng thêm vào giỏ

```text
ProductDetail.jsx
  -> CartContext.addToCart()
  -> cartApi.addItem()
  -> POST /api/cart/items
  -> CartController.AddItem()
  -> kiểm tra product/variant/tồn kho
  -> tạo hoặc cập nhật CartItem
  -> SaveChanges
```

Backend không tin dữ liệu giá hoặc tồn kho từ frontend.

Nó tải lại variant từ database và kiểm tra:

- Product còn active.
- Variant còn active.
- Chưa bị xóa mềm.
- Số lượng không vượt tồn kho.

## 12. Luồng đặt hàng

Có hai nhánh.

### Checkout từ giỏ

```text
Cart.jsx
  -> chọn CartItem
  -> Checkout.jsx
  -> POST /api/cart/checkout
  -> CartController.Checkout()
```

### Mua ngay

```text
ProductDetail.jsx
  -> handleBuyNow()
  -> truyền buyNowItem qua route state
  -> Checkout.jsx
  -> POST /api/orders
  -> OrdersController.Create()
```

### Xử lý chung ở backend

```text
1. Bắt đầu transaction.
2. Tải lại sản phẩm và variant.
3. Kiểm tra tồn kho.
4. Lấy giá thật: SalePrice ?? Price.
5. Tạo OrderDetail snapshot.
6. Trừ tồn kho.
7. Tăng SoldCount.
8. Tính lại coupon.
9. Tạo Order.
10. Commit.
```

Công thức:

```text
Subtotal = tổng (đơn giá * số lượng)
Total = max(0, Subtotal - Discount) + ShippingFee + Tax
```

Trạng thái mới:

```text
OrderStatus   = pending
PaymentStatus = pending
```

File cần mở:

```text
BaseCore.WebClient/src/pages/Checkout.jsx
BaseCore.APIService/Controllers/CartController.cs
BaseCore.APIService/Controllers/OrdersController.cs
BaseCore.APIService/Services/CouponDiscountCalculator.cs
```

## 13. Vòng đời đơn hàng

Luồng bình thường:

```text
pending -> confirmed -> shipping -> delivered
```

Luồng hủy:

```text
pending/confirmed/shipping -> cancelled
```

Khi hủy:

- Hoàn lại tồn kho.
- Giảm `SoldCount`.

Luồng trả hàng:

```text
delivered
  -> return_requested
  -> refunded hoặc return_rejected
```

Khi duyệt trả hàng:

- Hoàn tồn kho.
- Giảm `SoldCount`.
- `PaymentStatus = refunded`.
- Giữ nguyên `TotalAmount` làm lịch sử.

## 14. Luồng coupon

```text
Checkout.jsx gọi API xem trước
  -> CouponsController.Apply()

Khi tạo đơn:
  -> backend gọi CouponDiscountCalculator.ApplyAsync()
  -> tính lại trên subtotal thật
```

Backend kiểm tra:

- Coupon tồn tại.
- Đang active.
- Trong thời gian sử dụng.
- Chưa vượt usage limit.
- Đủ giá trị đơn tối thiểu.
- Không giảm vượt giá trị đơn.

Không tin `discountAmount` frontend gửi lên.

## 15. Luồng đăng nhập và phân quyền

```text
Login.jsx
  -> authApi.login()
  -> API Gateway
  -> AuthController.Login()
  -> kiểm tra user/password
  -> tạo JWT
  -> AuthContext lưu token và user
```

Request sau đó được Axios gắn:

```text
Authorization: Bearer <JWT>
```

Backend dùng:

```csharp
[Authorize]
[Authorize(Roles = "Admin,Manager,manager")]
```

Frontend dùng:

```text
ProtectedRoute
AuthContext
```

## 16. Seed dữ liệu và lỗi trùng SKU

File:

```text
BaseCore.Repository/DbInitializer.cs
```

Seed chạy khi service khởi động.

Trước khi thêm sản phẩm seed, code kiểm tra:

- Slug đã tồn tại chưa.
- SKU của variant đã tồn tại chưa.

Mục đích là tránh lỗi unique key khi database đã có dữ liệu cũ hoặc ứng dụng
khởi động lại.

## 17. Unit test

| File | Kiểm tra |
|---|---|
| `CartCheckoutTests.cs` | Checkout giỏ và coupon |
| `OrderCalculationTests.cs` | Tính subtotal, shipping và total |
| `ProductVariantManagementTests.cs` | CRUD variant |
| `ProductReviewTests.cs` | Đánh giá sản phẩm |
| `ReturnManagementTests.cs` | Trả hàng, hoàn kho, hoàn tiền |
| `UnitTestUserService.cs` | Nghiệp vụ user |

Chạy test:

```powershell
dotnet test BaseCore.UnitTest/BaseCore.UnitTest.csproj
```

## 18. Câu hỏi bảo vệ thường gặp

### Tại sao dùng ProductVariant?

Một sản phẩm có thể có nhiều size, màu, SKU, giá và tồn kho khác nhau. Nếu
đưa tất cả vào `Product`, hệ thống không quản lý chính xác từng lựa chọn.

### Tại sao lưu snapshot trong CartItem và OrderDetail?

Để tên, SKU, size, màu và giá lịch sử không thay đổi khi admin sửa catalog.
Khi checkout, backend vẫn lấy lại giá thật hiện tại để tránh gian lận.

### Tại sao phải dùng transaction khi checkout?

Tạo đơn, tạo chi tiết, trừ kho, tăng số đã bán, tăng lượt dùng coupon và xóa
giỏ phải thành công cùng nhau. Nếu một bước lỗi thì rollback toàn bộ.

### Tại sao không tin giá frontend?

Người dùng có thể sửa payload bằng DevTools hoặc Postman. Backend phải tải
giá từ database và tự tính lại tổng tiền.

### Tại sao SKU phải unique?

SKU là mã nhận diện một biến thể trong kho. Trùng SKU gây nhầm lẫn khi nhập
kho, bán hàng và truy vết đơn.

### Tại sao dùng repository?

Repository gom logic truy vấn dữ liệu, giảm việc viết EF Core lặp lại trong
controller và giúp mock khi unit test.

### Tại sao vẫn có controller dùng DbContext trực tiếp?

Một số nghiệp vụ transaction phức tạp như checkout cần thao tác đồng thời
nhiều bảng. Code hiện tại dùng cùng một DbContext để đảm bảo transaction.
Đây cũng là điểm có thể refactor thành application service/unit of work.

### Tại sao có API Gateway?

Frontend chỉ cần gọi một địa chỉ `/api`. Gateway quyết định request đi đến
AuthService hay APIService, giúp tách service mà không làm frontend biết từng
cổng nội bộ.

### Tại sao ảnh upload không lưu trực tiếp vào database?

Database chỉ lưu URL. File ảnh được lưu trên filesystem, giúp database nhẹ
hơn và việc phục vụ file đơn giản hơn.

### Tại sao tìm kiếm được thực hiện ở database?

Để hỗ trợ phân trang và tránh tải toàn bộ sản phẩm về trình duyệt. EF Core
chuyển biểu thức LINQ thành SQL.

## 19. Điểm cần lưu ý khi trình bày

Một số phần hiện còn mang tính demo hoặc cần hoàn thiện:

- Trang payment management có dữ liệu mock trong frontend.
- PayPal/bank transfer hiện chủ yếu lưu phương thức, chưa có gateway thanh
  toán hoàn chỉnh.
- Checkout attributes đang hiển thị phụ phí ở frontend nhưng cần kiểm tra
  việc lưu và cộng phí tương ứng ở backend trước khi production.
- `GET /api/orders` có logic seed đơn mẫu khi người dùng chưa có đơn.
- `BaseCore.Services/OrderService.cs` không phải đường chạy chính của API tạo
  đơn hiện tại.
- Ảnh upload đang lưu trên máy chạy API; production nên dùng object storage
  hoặc CDN.

Nêu các điểm này như hướng phát triển, không nên khẳng định hệ thống đã hoàn
thiện thanh toán production.

## 20. Bản đồ tìm lỗi nhanh

| Hiện tượng | Kiểm tra |
|---|---|
| Frontend gọi API 404 | `services/api.js`, `ocelot.json`, route controller |
| Request 401 | JWT trong localStorage, Axios interceptor, `[Authorize]` |
| Request 403 | Role trong token và `[Authorize(Roles = ...)]` |
| Không tìm thấy sản phẩm | `Shop.jsx`, `ProductsController`, `ProductRepository` |
| Lọc giá sai | `Products.jsx`, `ProductRepository.SearchAsync()` |
| Trùng SKU | `SQLServerDbContext`, form variant, `DbInitializer` |
| Ảnh variant không hiện | URL variant, endpoint `products/images`, file upload |
| Không thêm được giỏ | `CartContext`, `CartController.AddItem`, tồn kho |
| Tổng đơn sai | `Checkout.jsx`, `CartController.Checkout`, coupon calculator |
| Hủy đơn không hoàn kho | `OrdersController.RestoreOrderStock()` |
| Build báo file bị khóa | Dừng API/Auth/Gateway đang chạy trong Visual Studio |
| VS Code báo file newer | File đã bị công cụ khác sửa; dùng Compare hoặc reload |

## 21. Các lệnh nên nhớ

Build frontend:

```powershell
cd BaseCore.WebClient
npm.cmd run build
```

Build backend:

```powershell
dotnet build BaseCore.APIService/BaseCore.APIService.csproj
```

Build solution:

```powershell
dotnet build BaseCore.sln
```

Chạy unit test:

```powershell
dotnet test BaseCore.UnitTest/BaseCore.UnitTest.csproj
```

Tìm một đoạn code:

```powershell
rg -n "từ khóa" .
```

## 22. Cách trả lời nhanh khi bị hỏi một chức năng

Dùng cấu trúc năm ý:

1. **Điểm bắt đầu:** người dùng thao tác ở page/component nào.
2. **Request:** frontend gọi endpoint nào và gửi dữ liệu gì.
3. **Xử lý:** controller validate những gì.
4. **Dữ liệu:** repository/entity/bảng nào được đọc hoặc ghi.
5. **An toàn:** có authorization, transaction, kiểm tra tồn kho hoặc tính lại
   dữ liệu ở backend hay không.

Ví dụ trả lời luồng đặt hàng:

> Người dùng gửi form ở `Checkout.jsx`. Nếu mua từ giỏ, frontend gọi
> `POST /api/cart/checkout`; nếu mua ngay thì gọi `POST /api/orders`.
> Backend tải lại variant, kiểm tra active và tồn kho, tự lấy giá trong
> database, tạo snapshot `OrderDetail`, trừ kho và tạo `Order` trong
> transaction. Thành công thì trạng thái đơn và thanh toán đều là `pending`.

