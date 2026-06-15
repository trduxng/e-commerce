# Hướng dẫn kiến trúc và workflow BaseCore

## 1. Tổng quan ngắn gọn

BaseCore là một ứng dụng thương mại điện tử gồm:

- Giao diện React dành cho khách hàng và quản trị viên.
- API Gateway làm cửa vào chung cho frontend.
- AuthService xử lý đăng nhập, đăng ký và người dùng.
- APIService xử lý sản phẩm, danh mục, giỏ hàng và đơn hàng.
- Repository sử dụng Entity Framework Core để làm việc với SQL Server.

Sơ đồ hoạt động chính:

```text
React WebClient :3000
        |
        v
API Gateway :5000
        |
        +--> AuthService :5002
        |       |
        |       +--> Đăng nhập, đăng ký, user, role
        |
        +--> APIService :5001
                |
                +--> Sản phẩm, danh mục
                +--> Giỏ hàng, địa chỉ
                +--> Đơn hàng, đánh giá
                        |
                        v
                   Repository
                        |
                        v
                    SQL Server
```

Mặc dù tài liệu cũ gọi đây là kiến trúc microservices, code hiện tại gần với một **modular monolith được tách thành nhiều process** hơn:

- AuthService và APIService dùng chung database.
- Hai service dùng chung `SQLServerDbContext`.
- Các service dùng chung `Entities` và `Repository`.

---

## 2. Những project thực sự quan trọng

### `BaseCore.WebClient`

Frontend React/Vite của hệ thống.

Nó chứa:

- `src/pages`: các trang như Home, Login, Cart, Checkout và Dashboard.
- `src/components`: layout và component tái sử dụng.
- `src/contexts`: trạng thái đăng nhập, giỏ hàng, yêu thích và giao diện.
- `src/services/api.js`: nơi tập trung các lời gọi API.
- `src/App.jsx`: định nghĩa route và bọc các context provider.

Frontend chạy ở:

```text
http://localhost:3000
```

### `BaseCore.ApiGateway`

Gateway sử dụng Ocelot.

Nhiệm vụ:

- Nhận mọi request `/api/...` từ frontend.
- Chuyển request xác thực sang AuthService.
- Chuyển request nghiệp vụ bán hàng sang APIService.

Gateway chạy ở:

```text
http://localhost:5000
```

Cấu hình route nằm trong:

```text
BaseCore.ApiGateway/ocelot.json
```

### `BaseCore.AuthService`

Backend phụ trách:

- Đăng nhập.
- Đăng ký.
- Quản lý người dùng.
- Quản lý role.
- Phát hành JWT.

AuthService chạy ở:

```text
http://localhost:5002
```

### `BaseCore.APIService`

Backend phụ trách nghiệp vụ thương mại điện tử:

- Sản phẩm.
- Danh mục.
- Đánh giá sản phẩm.
- Yêu thích.
- Giỏ hàng.
- Địa chỉ giao hàng.
- Tài khoản khách hàng.
- Đơn hàng.

APIService chạy ở:

```text
http://localhost:5001
```

### `BaseCore.Repository`

Tầng truy cập dữ liệu.

Nó chứa:

- `SQLServerDbContext.cs`: khai báo bảng và ánh xạ entity sang SQL Server.
- `EFCore`: các repository cho sản phẩm, danh mục và đơn hàng.
- `Authen`: repository dành cho người dùng.
- `Migrations`: lịch sử thay đổi cấu trúc database.
- `DbInitializer.cs`: tự migrate và tạo dữ liệu mẫu.

### `BaseCore.Entities`

Chứa các entity đại diện cho dữ liệu:

- `User`
- `Product`
- `ProductVariant`
- `Category`
- `Cart`
- `CartItem`
- `Order`
- `OrderDetail`
- `FavoriteProduct`
- `Voucher`

Có thể hiểu entity là hình dạng dữ liệu được lưu trong database.

### `BaseCore.Services`

Theo kiến trúc chuẩn, đây phải là nơi chứa business logic.

Tuy nhiên code hiện tại sử dụng project này không đồng đều:

- User đi qua `UserService`.
- Product, cart và order phần lớn xử lý trực tiếp trong controller hoặc repository.

### `BaseCore.Common`

Chứa thành phần dùng chung:

- Tạo và kiểm tra JWT.
- Constant.
- Enum.
- Helper.
- Một số tiện ích Redis và WebSocket.

---

## 3. Ý nghĩa các tầng

Có thể ghi nhớ bằng bảng sau:

| Tầng | Vai trò |
|---|---|
| Page/Component | Hiển thị giao diện và nhận thao tác người dùng |
| API client | Gửi HTTP request từ React |
| Gateway | Chuyển request đến backend phù hợp |
| Controller | Nhận request và trả response |
| Service | Xử lý quy tắc nghiệp vụ |
| Repository | Truy vấn và lưu dữ liệu |
| DbContext | Kết nối Entity Framework Core với SQL Server |
| Entity | Đại diện cho dữ liệu trong hệ thống |

Luồng lý tưởng:

```text
Page
  -> API client
  -> Gateway
  -> Controller
  -> Service
  -> Repository
  -> DbContext
  -> Database
```

Luồng thực tế trong BaseCore đôi khi là:

```text
Controller
  -> Repository
  -> Database
```

Hoặc:

```text
Controller
  -> DbContext trực tiếp
  -> Database
```

Đây là một trong những nguyên nhân khiến repo khó đọc.

---

## 4. Luồng lấy danh sách sản phẩm

Khi người dùng mở trang cửa hàng:

```text
Trang React
  -> productApi.getAll()
  -> GET /api/products
  -> Vite proxy
  -> Gateway :5000
  -> APIService :5001
  -> ProductsController
  -> ProductRepositoryEF
  -> SQLServerDbContext
  -> SQL Server
```

Chi tiết:

1. React gọi hàm trong `BaseCore.WebClient/src/services/api.js`.
2. Axios dùng base URL `/api`.
3. Vite chuyển `/api` sang `http://localhost:5000`.
4. Gateway đọc `ocelot.json`.
5. Route sản phẩm được chuyển sang APIService port `5001`.
6. `ProductsController` nhận request.
7. Controller gọi `ProductRepositoryEF`.
8. Repository sử dụng `SQLServerDbContext`.
9. Kết quả được trả ngược về frontend dưới dạng JSON.

---

## 5. Luồng đăng nhập

Sơ đồ:

```text
Login.jsx
  -> AuthContext.login()
  -> authApi.login()
  -> POST /api/auth/login
  -> Gateway
  -> AuthController
  -> UserService
  -> UserRepository
  -> SQL Server
  -> TokenHelper tạo JWT
  -> Frontend lưu token
```

### Bước 1: Người dùng nhập thông tin

Trang login gọi:

```text
AuthContext.login(username, password)
```

### Bước 2: Frontend gửi request

`authApi.login` gửi:

```http
POST /api/auth/login
Content-Type: application/json
```

### Bước 3: Gateway điều hướng

Gateway chuyển request `/api/auth/...` đến:

```text
http://localhost:5002
```

### Bước 4: Backend kiểm tra tài khoản

Luồng backend:

```text
AuthController
  -> UserService.Authenticate()
  -> UserRepository.GetByUsernameAsync()
  -> bảng auth.users
```

### Bước 5: Tạo token

Nếu tài khoản hợp lệ, `TokenHelper.GenerateToken()` tạo JWT chứa:

- User ID.
- Username.
- Role.
- Thời gian hết hạn.

### Bước 6: Frontend lưu trạng thái đăng nhập

Frontend lưu vào `localStorage`:

```text
token
user
```

Axios interceptor sẽ tự thêm token vào các request tiếp theo:

```http
Authorization: Bearer <token>
```

---

## 6. Luồng thêm sản phẩm vào giỏ hàng

```text
Product page
  -> CartContext.addToCart()
  -> POST /api/cart/items
  -> Gateway
  -> CartController.AddItem()
  -> SQLServerDbContext
  -> bảng orders.carts
  -> bảng orders.cart_items
```

Backend thực hiện:

1. Lấy user ID từ JWT.
2. Tìm sản phẩm và biến thể sản phẩm.
3. Kiểm tra sản phẩm còn hoạt động.
4. Kiểm tra số lượng tồn kho.
5. Tìm hoặc tạo giỏ hàng cho user.
6. Thêm hoặc tăng số lượng cart item.
7. Lưu thay đổi vào database.
8. Trả giỏ hàng mới về frontend.

Giỏ hàng chỉ hoạt động khi người dùng đã đăng nhập.

---

## 7. Luồng checkout

Đây là luồng nghiệp vụ quan trọng nhất.

```text
Checkout.jsx
  -> cartApi.checkout(payload)
  -> POST /api/cart/checkout
  -> Gateway
  -> CartController.Checkout()
  -> Database transaction
```

Backend thực hiện:

1. Lấy user ID từ JWT.
2. Đọc giỏ hàng của user.
3. Kiểm tra giỏ hàng không rỗng.
4. Bắt đầu database transaction.
5. Đọc lại sản phẩm và tồn kho từ database.
6. Kiểm tra số lượng mua hợp lệ.
7. Tính lại giá trên server.
8. Trừ số lượng tồn kho.
9. Tăng số lượng sản phẩm đã bán.
10. Kiểm tra địa chỉ, phương thức giao hàng và thanh toán.
11. Tạo `Order`.
12. Tạo các `OrderDetail`.
13. Xóa sản phẩm khỏi giỏ hàng.
14. Lưu tất cả thay đổi.
15. Commit transaction.

Transaction giúp đảm bảo:

- Không tạo đơn nếu cập nhật tồn kho thất bại.
- Không trừ kho nếu tạo đơn thất bại.
- Không xóa giỏ hàng nếu transaction chưa thành công.

---

## 8. Luồng xem và quản lý đơn hàng

### Khách hàng

Khách hàng gọi:

```http
GET /api/orders
```

Backend lấy user ID trong JWT và chỉ trả đơn hàng của user đó.

### Quản trị viên

Admin gọi:

```http
GET /api/orders/all
```

Endpoint yêu cầu role:

```text
Admin
```

Admin có thể:

- Xem toàn bộ đơn hàng.
- Tìm kiếm và phân trang.
- Xem thống kê doanh thu.
- Cập nhật trạng thái đơn.

### Hủy đơn

Khi khách hàng hủy đơn:

1. Backend kiểm tra quyền sở hữu đơn hàng.
2. Kiểm tra trạng thái đơn.
3. Hoàn lại tồn kho.
4. Giảm số lượng đã bán.
5. Chuyển trạng thái sang `cancelled`.

---

## 9. Cấu trúc database

`SQLServerDbContext` chia dữ liệu thành các schema.

### Schema `auth`

```text
users
user_addresses
```

### Schema `catalog`

```text
product_types
products
product_variants
favorite_products
product_reviews
```

### Schema `orders`

```text
carts
cart_items
bills
bill_details
```

Tên entity và tên bảng không phải lúc nào cũng giống nhau:

| Entity | Bảng |
|---|---|
| `Category` | `catalog.product_types` |
| `Order` | `orders.bills` |
| `OrderDetail` | `orders.bill_details` |

Việc này cũng có thể gây khó hiểu khi lần code sang database.

---

## 10. Quá trình khởi động hệ thống

### APIService và AuthService

Khi khởi động, mỗi service:

1. Đọc cấu hình.
2. Đăng ký controller.
3. Đăng ký `SQLServerDbContext`.
4. Đăng ký dependency injection.
5. Cấu hình JWT.
6. Chạy `DbInitializer`.
7. Tự động áp dụng migration.
8. Tạo dữ liệu mẫu nếu chưa có.
9. Bắt đầu nhận HTTP request.

### Các port

| Thành phần | Port |
|---|---:|
| WebClient | `3000` |
| API Gateway | `5000` |
| APIService | `5001` |
| AuthService | `5002` |

Để ứng dụng hoạt động đầy đủ, cần chạy cả bốn thành phần.

---

## 11. Những phần gây rối trong repo

### Kiến trúc không đồng nhất

Auth đi theo luồng:

```text
Controller -> Service -> Repository
```

Product và order thường đi theo:

```text
Controller -> Repository
```

Cart lại thường đi theo:

```text
Controller -> DbContext
```

Do đó không thể áp dụng một quy tắc duy nhất khi đọc toàn bộ repo.

### Business logic nằm trong controller

`CartController` và `OrdersController` đang chứa nhiều logic:

- Kiểm tra dữ liệu.
- Tính tiền.
- Kiểm tra tồn kho.
- Trừ và hoàn tồn kho.
- Tạo đơn.
- Điều khiển transaction.

Các phần này phù hợp hơn nếu được chuyển sang service chuyên biệt.

### Có hai đường tạo đơn

Hiện có:

```text
POST /api/orders
POST /api/cart/checkout
```

Cả hai đều có logic tạo order. Điều này dễ dẫn đến:

- Trùng code.
- Hai endpoint tính tiền khác nhau.
- Sửa một nơi nhưng quên sửa nơi còn lại.

### Một số project là code cũ hoặc chưa tích hợp

Các phần sau không nằm trong luồng chạy chính hiện tại:

- `BaseCore.AuditLog`
- `BaseCore.LogService`
- `BaseCore.IOTService`
- `Examples`
- `Test`
- `.history`
- `.history-memo`

`BaseCore.DTO` tồn tại nhưng nhiều controller vẫn tự khai báo DTO ngay trong file controller.

`BaseCore.AuthService/ClientApp` là một frontend khác, trong khi frontend chính hiện tại là `BaseCore.WebClient`.

### Tài liệu kiến trúc không hoàn toàn khớp code

Tài liệu cũ nói về:

- Redis cache.
- Logging và audit đầy đủ.
- Microservices độc lập.

Nhưng code runtime hiện tại chưa triển khai hoặc chưa kết nối đầy đủ các phần này.

Khi có mâu thuẫn, nên tin:

1. `Program.cs`
2. `ocelot.json`
3. Controller đang được map
4. Project reference
5. Code repository và DbContext

Không nên chỉ dựa vào tài liệu cũ.

---

## 12. Cách đọc repo không bị lạc

Không nên đọc lần lượt từng folder từ trên xuống.

Hãy chọn một chức năng và lần theo thứ tự:

```text
Page
  -> Context hoặc handler
  -> services/api.js
  -> ocelot.json
  -> Controller
  -> Service nếu có
  -> Repository hoặc DbContext
  -> Entity
  -> SQLServerDbContext mapping
```

Thứ tự chức năng nên đọc:

1. Lấy danh sách sản phẩm.
2. Đăng nhập.
3. Thêm sản phẩm vào giỏ.
4. Checkout.
5. Xem đơn hàng cá nhân.
6. Admin quản lý đơn hàng.

Đây là cách học theo chiều dọc của một chức năng thay vì học ngang từng tầng.

---

## 13. Danh sách file nên đọc

### Khởi động và điều hướng

```text
BaseCore.WebClient/src/App.jsx
BaseCore.WebClient/src/services/api.js
BaseCore.WebClient/vite.config.js
BaseCore.ApiGateway/Program.cs
BaseCore.ApiGateway/ocelot.json
BaseCore.APIService/Program.cs
BaseCore.AuthService/Program.cs
```

### Authentication

```text
BaseCore.WebClient/src/contexts/AuthContext.jsx
BaseCore.AuthService/Controllers/AuthController.cs
BaseCore.Services/Authen/UserService.cs
BaseCore.Repository/Authen/UserRepository.cs
BaseCore.Common/Auth/TokenHelper.cs
```

### Sản phẩm

```text
BaseCore.APIService/Controllers/ProductsController.cs
BaseCore.Repository/EFCore/ProductRepository.cs
BaseCore.Entities/Product.cs
BaseCore.Entities/ProductVariant.cs
```

### Giỏ hàng và checkout

```text
BaseCore.WebClient/src/contexts/CartContext.jsx
BaseCore.WebClient/src/pages/Checkout.jsx
BaseCore.APIService/Controllers/CartController.cs
BaseCore.Entities/Cart.cs
BaseCore.Entities/CartItem.cs
```

### Đơn hàng

```text
BaseCore.APIService/Controllers/OrdersController.cs
BaseCore.Repository/EFCore/OrderRepository.cs
BaseCore.Entities/Order.cs
BaseCore.Entities/OrderDetail.cs
```

### Database

```text
BaseCore.Repository/SQLServerDbContext.cs
BaseCore.Repository/DbInitializer.cs
BaseCore.Repository/Migrations
```

---

## 14. Hướng đơn giản hóa kiến trúc

Một cấu trúc dễ hiểu hơn có thể là:

```text
src/
  WebClient/
  Gateway/
  Auth/
    Controllers/
    Services/
    Repositories/
    DTOs/
  Commerce/
    Products/
    Categories/
    Cart/
    Orders/
  Infrastructure/
    Database/
    Authentication/
  Shared/
tests/
docs/
```

Trong phạm vi code hiện tại, có thể cải thiện dần:

1. Chuyển checkout sang `CheckoutService`.
2. Chỉ giữ một đường tạo đơn.
3. Chuyển DTO ra khỏi controller.
4. Không cho controller truy cập `DbContext` trực tiếp.
5. Tách code cũ khỏi solution hoặc đưa vào folder `legacy`.
6. Đổi tên project và folder theo chức năng thực tế.
7. Cập nhật tài liệu kiến trúc khớp với runtime.

---

## 15. Kết luận

Phần cốt lõi đang chạy của BaseCore là:

```text
BaseCore.WebClient
BaseCore.ApiGateway
BaseCore.AuthService
BaseCore.APIService
BaseCore.Services/Authen
BaseCore.Repository
BaseCore.Entities
BaseCore.Common/Auth
```

BaseCore không quá phức tạp về nghiệp vụ. Nó khó hiểu chủ yếu vì:

- Folder thể hiện kiến trúc mong muốn, không hoàn toàn phản ánh code thực tế.
- Các chức năng sử dụng tầng service không đồng nhất.
- Controller chứa quá nhiều business logic.
- Có code cũ và frontend cũ nằm chung repo.
- Tài liệu kiến trúc chưa theo kịp code.

Khi đọc repo, hãy luôn bắt đầu từ một hành động trên giao diện và lần theo request đến database. Đây là cách nhanh nhất để hiểu hệ thống mà không bị lạc trong số lượng project và folder.

---

## 16. Kiểm kê các phần dư thừa

Phần này phân loại theo mức độ an toàn. Không nên xóa tất cả trong một lần.

### Nhóm A: File sinh tự động, có thể dọn

Các thư mục này không phải source code:

```text
.vs/
.history/
.history-memo/
artifacts/
**/bin/
**/obj/
**/node_modules/
**/dist/
```

Chúng được IDE, .NET hoặc npm tạo lại khi cần.

Riêng `BaseCore.IOTService` hiện chỉ còn thư mục `obj` và không có file project/source code. Vì vậy toàn bộ folder này chỉ là tàn dư build cũ.

Các file cache sau cũng không cần lưu trong source:

```text
*.csproj.lscache
BaseCore.mv2
UpgradeLog.htm
```

Đa số các đường dẫn trên đã có trong `.gitignore`, nhưng một vài file đã từng được Git track nên vẫn xuất hiện trong repository.

### Nhóm B: Bài tập hoặc project mẫu, có thể tách khỏi ứng dụng

```text
Examples/
Test/
```

`Examples` chứa các bài HTML, CSS và JavaScript độc lập, không tham gia workflow BaseCore.

`Test` là một worker project mẫu, không phải project unit test chính và không nằm trong `BaseCore.sln`.

Nếu các folder này chỉ phục vụ học tập, nên:

- Chuyển sang repository bài tập riêng; hoặc
- Chuyển vào `archive/`; hoặc
- Xóa khỏi BaseCore sau khi đã sao lưu.

Không nhầm `Test` với `BaseCore.UnitTest`. `BaseCore.UnitTest` chứa các test có giá trị cho ứng dụng và nên giữ.

### Nhóm C: Frontend cũ gần như chắc chắn không còn dùng

```text
BaseCore.AuthService/ClientApp/
```

Đây là một React app riêng nằm trong AuthService.

Hiện tại:

- Frontend chính là `BaseCore.WebClient`.
- `BaseCore.AuthService/Program.cs` không cấu hình SPA.
- AuthService không có `UseSpa`, `UseSpaStaticFiles` hoặc bước build `ClientApp`.
- Không tìm thấy code runtime tham chiếu đến `ClientApp`.

Vì vậy `BaseCore.AuthService/ClientApp` có thể được xem là frontend cũ. Nên chạy thử toàn bộ hệ thống sau khi tạm di chuyển folder này trước khi xóa hẳn.

### Nhóm D: Logging và Audit legacy

```text
BaseCore.AuditLog/
BaseCore.LogService/
```

Dấu hiệu đây là code legacy:

- Không nằm trong `BaseCore.sln`.
- Gateway không có route tới AuditLog.
- APIService và AuthService không đăng ký `LogService`.
- Không tìm thấy dependency từ các project runtime chính tới hai project này.
- `BaseCore.AuditLog` vẫn target `.NET Core 2.2`, trong khi hệ thống chính dùng `.NET 8`.

Hai project này tạo cảm giác hệ thống đã có logging/audit hoàn chỉnh, nhưng thực tế chúng không tham gia luồng runtime hiện tại.

Có hai hướng:

1. Nếu không dùng audit: chuyển cả hai vào `archive/legacy`.
2. Nếu muốn dùng audit: viết lại trên .NET 8 và tích hợp vào middleware của APIService/AuthService.

Không nên giữ chúng ở cấp root với tên như một thành phần đang hoạt động.

### Nhóm E: Project nằm trong solution nhưng gần như chưa được dùng

#### `BaseCore.DTO`

Project này nằm trong solution nhưng không được APIService hoặc AuthService tham chiếu.

Controller hiện tự khai báo DTO ở cuối file, ví dụ:

```text
CreateOrderDto
CartCheckoutDto
LoginRequest
LoginResponse
```

Các DTO trong `BaseCore.DTO/AuthPlatform` có vẻ thuộc thiết kế cũ.

Hướng xử lý:

- Nếu muốn kiến trúc có DTO dùng chung: chuyển DTO thật từ controller vào project này.
- Nếu không: bỏ project khỏi solution và chuyển code cũ vào archive.

Không nên vừa giữ `BaseCore.DTO`, vừa tiếp tục khai báo DTO rải rác trong controller.

#### `BaseCore.Libs`

Project này chỉ chứa một số utility cũ.

Runtime chính không trực tiếp sử dụng nó. Hiện nó chủ yếu còn liên quan tới:

- `BaseCore.LogService` legacy.
- `BaseCore.UnitTest`.

Không nên xóa ngay vì unit test còn project reference tới `BaseCore.Libs`. Trước tiên cần kiểm tra test nào thực sự sử dụng class trong project này, sau đó:

- Chuyển utility còn cần sang `BaseCore.Common`; hoặc
- Xóa project reference dư khỏi unit test.

#### Các service sản phẩm, danh mục và đơn hàng

Các file:

```text
BaseCore.Services/ProductService.cs
BaseCore.Services/CategoryService.cs
BaseCore.Services/OrderService.cs
BaseCore.Services/IProductService.cs
BaseCore.Services/ICategoryService.cs
BaseCore.Services/IOrderService.cs
```

APIService hiện không đăng ký các service này trong dependency injection. Controller gọi repository hoặc DbContext trực tiếp.

Do đó chúng là code không nằm trong runtime hiện tại.

Tuy nhiên không nên xóa ngay nếu kế hoạch refactor là đưa business logic ra khỏi controller. Chúng có thể được:

- Viết lại để trở thành application service thật; hoặc
- Xóa nếu quyết định giữ controller gọi repository.

### Nhóm F: Thành phần trong project đang chạy nhưng có dấu hiệu thừa

#### Package không phản ánh runtime

Một số project tham chiếu package lớn nhưng chưa thấy dùng trong luồng chính:

```text
MongoDB.Driver
StackExchange.Redis
Quartz
Pomelo.EntityFrameworkCore.Lolita.SqlServer
Pomelo.EntityFrameworkCore.Lolita2.SqlServer
```

Trong khi database runtime chính hiện dùng:

```text
Microsoft.EntityFrameworkCore.SqlServer
```

Không nên xóa package chỉ bằng quan sát tên. Cần chạy:

```powershell
dotnet build BaseCore.sln
dotnet test BaseCore.UnitTest/BaseCore.UnitTest.csproj
```

sau mỗi nhóm thay đổi.

#### Code seed bị lặp

`BaseCore.APIService/Program.cs` và `BaseCore.AuthService/Program.cs` còn các hàm seed local ở cuối file, trong khi startup thực tế gọi:

```text
BaseCore.Repository/DbInitializer.cs
```

Các hàm local không được gọi là code dư và có thể xóa sau khi xác nhận build.

#### Hai đường tạo đơn

Hệ thống có hai endpoint:

```text
POST /api/orders
POST /api/cart/checkout
```

Đây không phải file thừa đơn thuần, nhưng là logic trùng. Frontend hiện checkout qua `/api/cart/checkout`.

Nên chọn một workflow chuẩn:

- Giữ `CartController.Checkout` và bỏ đường tạo trực tiếp trong `OrdersController`; hoặc
- Chuyển logic chung vào `CheckoutService` rồi cho cả hai endpoint gọi chung.

### Nhóm G: Tài liệu và file phụ cần sắp xếp

Các file sau không tham gia runtime:

```text
push.md
UPGRADE_PLAN.md
SYSTEM_ARCHITECTURE.md
PRODUCTION_READINESS.md
KienThucCanCo.md
database/*.md
```

Chúng không nhất thiết là rác. Vấn đề là tài liệu đang nằm rải rác ở root và một số nội dung không còn khớp code.

Nên gom thành:

```text
document/
  architecture/
  database/
  learning/
  legacy/
```

### Danh sách tuyệt đối chưa nên xóa

Các phần sau đang tham gia trực tiếp vào ứng dụng:

```text
BaseCore.WebClient/
BaseCore.ApiGateway/
BaseCore.APIService/
BaseCore.AuthService/
BaseCore.Entities/
BaseCore.Repository/
BaseCore.Common/
BaseCore.Services/Authen/
BaseCore.UnitTest/
database/ecommerce_ddl.sql
BaseCore.sln
```

`BaseCore.Services` vẫn phải giữ ít nhất phần `Authen`, vì AuthService đang phụ thuộc vào `IUserService` và `UserService`.

### Thứ tự dọn dẹp đề xuất

1. Dọn file sinh tự động và cache.
2. Chuyển `Examples` và `Test` vào archive.
3. Tạm di chuyển `BaseCore.AuthService/ClientApp`.
4. Chuyển AuditLog và LogService vào `archive/legacy`.
5. Xử lý DTO và Libs sau khi kiểm tra reference.
6. Xóa service không dùng hoặc tích hợp chúng đúng cách.
7. Hợp nhất hai workflow tạo đơn.
8. Gỡ package không dùng, mỗi lần một nhóm.
9. Build và test sau từng bước.
