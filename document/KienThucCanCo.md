# Kiến thức cần có để làm chủ dự án BaseCore

BaseCore là một dự án **website thương mại điện tử full-stack** được xây dựng theo hướng tách nhiều project. Hệ thống có giao diện mua hàng, trang quản trị, dịch vụ xác thực, dịch vụ nghiệp vụ, API Gateway và cơ sở dữ liệu SQL Server.

Tài liệu này trình bày những kiến thức cần học để có thể đọc hiểu, chạy, sửa lỗi và tiếp tục phát triển dự án. Nội dung được chia thành từng tầng, đi từ nền tảng đến kiến trúc và nghiệp vụ thực tế.

> Stack chính đang được sử dụng: **React 18, Vite 5, JavaScript, Bootstrap 5, Axios, TanStack Query, ASP.NET Core 8, C#, Entity Framework Core 8, SQL Server, JWT và Ocelot API Gateway**.

---

## Tầng 1: Kiến thức nền tảng lập trình và Web

Đây là phần bắt buộc phải nắm trước khi học framework.

### 1. HTML

HTML tạo cấu trúc cho giao diện web. Cần hiểu:

- Các thẻ thường dùng: `div`, `header`, `main`, `section`, `form`, `input`, `button`, `table`, `img`, `a`.
- Form đăng nhập, đăng ký, tìm kiếm, giỏ hàng và thanh toán.
- Semantic HTML và khả năng truy cập cơ bản.
- Thuộc tính `id`, `class`, `name`, `value`, `disabled`, `required`.

Trong BaseCore, HTML chủ yếu được viết dưới dạng **JSX** trong các React component.

### 2. CSS và Responsive

Cần nắm:

- Box model: `margin`, `border`, `padding`, `width`, `height`.
- Flexbox và CSS Grid.
- Responsive theo kích thước màn hình.
- Biến CSS, trạng thái `hover`, `focus`, animation cơ bản.
- Cách Bootstrap tổ chức grid, utility class và component.

BaseCore sử dụng:

- Bootstrap 5.
- CSS riêng tại `BaseCore.WebClient/src/styles/app.css`.
- Một số thư viện giao diện cũ trong `BaseCore.WebClient/public/lib`.

### 3. JavaScript hiện đại

Các phần quan trọng:

- `let`, `const`, scope và kiểu dữ liệu.
- Array và object.
- Destructuring, spread operator, template string.
- Các hàm `map`, `filter`, `find`, `some`, `reduce`.
- Module ES với `import` và `export`.
- Optional chaining: `object?.property`.
- Promise, `async/await`, `try/catch`.
- JSON và chuyển đổi dữ liệu giữa frontend với backend.

### 4. DOM và sự kiện

Cần hiểu:

- DOM là cây biểu diễn trang web trong trình duyệt.
- Sự kiện `click`, `change`, `submit`, `input`.
- Event propagation.
- Local storage và cách trình duyệt lưu JWT.

React quản lý phần lớn thao tác DOM, nhưng hiểu DOM vẫn cần thiết để debug giao diện.

### 5. HTTP và REST API

Cần hiểu:

- Request và response.
- URL, query string, route parameter, request body.
- Header `Content-Type` và `Authorization`.
- Các method `GET`, `POST`, `PUT`, `DELETE`.
- Các status code phổ biến: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- CORS và lý do frontend không phải lúc nào cũng gọi được backend.

Luồng cơ bản trong BaseCore:

```text
React -> Axios -> /api/... -> Ocelot Gateway -> ASP.NET Core Service -> SQL Server
```

---

## Tầng 2: Kiến thức Frontend với React

Frontend chính nằm trong project `BaseCore.WebClient`.

### 1. React 18

Cần nắm:

- Function component.
- JSX.
- Props và state.
- Conditional rendering.
- Render danh sách và thuộc tính `key`.
- Component lifecycle.
- Controlled form.

### 2. React Hooks

Các hook phải hiểu:

- `useState`: lưu trạng thái giao diện.
- `useEffect`: gọi API hoặc đồng bộ dữ liệu khi component thay đổi.
- `useContext`: chia sẻ đăng nhập, giỏ hàng, yêu thích, theme và thông báo.
- `useMemo`, `useCallback`: tối ưu khi thật sự cần.
- Custom hook để tái sử dụng logic.

BaseCore đang có các context:

- `AuthContext`: trạng thái đăng nhập và quyền người dùng.
- `CartContext`: giỏ hàng.
- `FavoriteContext`: sản phẩm yêu thích.
- `ThemeContext`: giao diện sáng/tối.
- `ToastContext`: thông báo.

### 3. React Router

Dự án dùng `react-router-dom` để chia route:

- Route công khai: trang chủ, cửa hàng, chi tiết sản phẩm, liên hệ.
- Route yêu cầu đăng nhập: giỏ hàng, thanh toán, tài khoản, đơn hàng, yêu thích.
- Route chỉ dành cho admin: dashboard, sản phẩm, danh mục, đơn hàng, doanh thu, người dùng.
- Route động như `/product/:id`.
- Chuyển hướng bằng `Navigate`.
- Bảo vệ trang bằng `ProtectedRoute`.

### 4. Quản lý dữ liệu từ API

BaseCore sử dụng:

- **Axios** để gửi HTTP request.
- Axios interceptor để tự động thêm JWT vào header.
- Retry có giới hạn cho request `GET` bị lỗi mạng hoặc lỗi server.
- **TanStack Query** để hỗ trợ quản lý server state.

Cần phân biệt:

- Client state: modal đang mở, input đang nhập, theme hiện tại.
- Server state: danh sách sản phẩm, đơn hàng, người dùng lấy từ API.

### 5. Lazy loading và Error Boundary

Các page được tải bằng `React.lazy` và `Suspense`. Cần hiểu:

- Code splitting.
- Loading fallback.
- Tại sao lazy loading giảm JavaScript tải ban đầu.
- Error Boundary dùng để ngăn một lỗi component làm hỏng toàn bộ ứng dụng.

### 6. Công cụ frontend

Cần biết:

- Node.js và npm.
- `package.json`.
- Vite development server và production build.
- Biến môi trường frontend.
- Cách đọc lỗi trong browser console và Network tab.

Các lệnh thường dùng:

```bash
cd BaseCore.WebClient
npm install
npm run dev
npm run build
```

---

## Tầng 3: Kiến thức C# và ASP.NET Core Backend

Backend chính sử dụng **.NET 8** và được chia thành nhiều project.

### 1. C# cơ bản

Cần học:

- Kiểu dữ liệu, biến, toán tử.
- Class, object, property, constructor.
- Interface và kế thừa.
- Generic như `List<T>`, `Task<T>`.
- LINQ: `Where`, `Select`, `FirstOrDefault`, `Any`, `Include`.
- Nullable reference type.
- Exception handling.
- `async/await`.

### 2. ASP.NET Core Web API

Cần hiểu:

- `Program.cs` và dependency injection container.
- Controller và action.
- Attribute routing: `[Route]`, `[HttpGet]`, `[HttpPost]`.
- Model binding từ route, query và body.
- `IActionResult`.
- Middleware pipeline.
- CORS.
- Swagger/OpenAPI.
- Configuration từ `appsettings.json`.

Ví dụ các controller nghiệp vụ:

- `ProductsController`.
- `CategoriesController`.
- `CartController`.
- `OrdersController`.
- `FavoritesController`.
- `AddressesController`.
- `AccountController`.
- `ProductReviewsController`.

### 3. Dependency Injection

BaseCore đăng ký repository và service bằng DI:

```text
Controller -> Interface -> Repository/Service -> DbContext -> Database
```

Cần hiểu vòng đời:

- `AddTransient`.
- `AddScoped`.
- `AddSingleton`.

Repository và `DbContext` thường dùng `Scoped` để tồn tại trong một HTTP request.

### 4. Kiến trúc nhiều project

Các project chính trong solution:

- `BaseCore.ApiGateway`: cổng vào chung dùng Ocelot.
- `BaseCore.APIService`: API sản phẩm, danh mục, giỏ hàng, đơn hàng và tài khoản.
- `BaseCore.AuthService`: đăng nhập, đăng ký, người dùng và vai trò.
- `BaseCore.Common`: constant, helper, JWT và thành phần dùng chung.
- `BaseCore.DTO`: object dùng để nhận/trả dữ liệu.
- `BaseCore.Entities`: entity ánh xạ dữ liệu.
- `BaseCore.Repository`: EF Core, DbContext, migration và repository.
- `BaseCore.Services`: tầng service xử lý nghiệp vụ.
- `BaseCore.Libs`: utility dùng chung.

Cần hiểu quy tắc phụ thuộc giữa các tầng, tránh để controller chứa toàn bộ nghiệp vụ hoặc để project hạ tầng phụ thuộc ngược vào giao diện.

### 5. Repository và Service pattern

Cần phân biệt:

- Controller nhận HTTP request và trả HTTP response.
- Service xử lý quy tắc nghiệp vụ.
- Repository thực hiện truy vấn và ghi dữ liệu.
- Entity biểu diễn dữ liệu lưu trong database.
- DTO biểu diễn dữ liệu đi qua API.

Một số controller hiện tại vẫn làm nhiều nghiệp vụ trực tiếp. Khi mở rộng dự án, nên chuyển logic tính tiền, tồn kho và trạng thái đơn hàng sang service chuyên biệt để dễ kiểm thử.

---

## Tầng 4: API Gateway và kiến trúc dịch vụ

BaseCore sử dụng **Ocelot** tại `BaseCore.ApiGateway`.

### 1. API Gateway là gì?

Frontend chỉ gọi một địa chỉ chung:

```text
http://localhost:5000/api/...
```

Gateway đọc `ocelot.json` rồi chuyển request:

- API xác thực và người dùng sang AuthService.
- API sản phẩm, danh mục, giỏ hàng, đơn hàng sang APIService.

### 2. Kiến thức cần học

- Upstream và downstream route.
- Reverse proxy.
- Service routing.
- CORS tại gateway và service.
- Timeout, retry và circuit breaker.
- Rate limiting.
- Authentication tập trung.
- Load balancing.
- Health check.

### 3. Microservice và modular monolith

Dự án đang tách executable thành Gateway, AuthService và APIService, nhưng vẫn chia sẻ nhiều project và cùng một database. Vì vậy cần hiểu cả:

- Tư duy microservice.
- Ranh giới nghiệp vụ.
- Shared database và nhược điểm coupling.
- Giao tiếp đồng bộ qua HTTP.
- Khi nào nên tách database hoặc dùng message broker.

Không nên gọi hệ thống là microservice hoàn chỉnh chỉ vì có nhiều project. Ranh giới dữ liệu, khả năng triển khai độc lập và giao tiếp giữa service cũng phải được thiết kế rõ.

---

## Tầng 5: Entity Framework Core và SQL Server

Dữ liệu được truy cập bằng **Entity Framework Core 8**.

### 1. SQL căn bản

Cần nắm:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- `WHERE`, `ORDER BY`, `GROUP BY`.
- `INNER JOIN`, `LEFT JOIN`.
- Primary key và foreign key.
- Unique index.
- Constraint.
- Transaction.
- Chuẩn hóa dữ liệu.

### 2. Entity Framework Core

Cần hiểu:

- `DbContext` và `DbSet`.
- Code First.
- Fluent API trong `OnModelCreating`.
- Quan hệ one-to-many và self-reference.
- `Include` và eager loading.
- Tracking và `AsNoTracking`.
- Migration.
- Transaction.
- Async query.

File trung tâm là:

```text
BaseCore.Repository/SQLServerDbContext.cs
```

### 3. Các schema và bảng nghiệp vụ

Hệ thống ánh xạ dữ liệu theo các vùng chính:

- `auth`: người dùng và địa chỉ.
- `catalog`: danh mục, sản phẩm, biến thể, yêu thích và đánh giá.
- `orders`: giỏ hàng, chi tiết giỏ hàng, hóa đơn và chi tiết hóa đơn.

Các quan hệ quan trọng:

```text
User -> UserAddress
Category -> Product
Product -> ProductVariant
User -> FavoriteProduct -> Product
User -> Review -> Product
User -> Cart -> CartItem -> ProductVariant
User -> Order -> OrderDetail -> ProductVariant
```

### 4. Migration và seed data

Cần hiểu:

- Migration ghi lại thay đổi schema.
- `database update` áp dụng migration vào SQL Server.
- Seed data tạo dữ liệu ban đầu.
- Không để seed chạy lặp gây trùng dữ liệu.
- Không tự động migrate thiếu kiểm soát trong môi trường production.

Các lệnh thường dùng:

```bash
dotnet ef migrations add TenMigration --project BaseCore.Repository --startup-project BaseCore.APIService
dotnet ef database update --project BaseCore.Repository --startup-project BaseCore.APIService
```

---

## Tầng 6: Xác thực, phân quyền và bảo mật

BaseCore dùng **JWT Bearer Authentication**.

### 1. JWT

Cần hiểu:

- Header, payload và signature.
- Claim `NameIdentifier`.
- Claim role.
- Thời gian hết hạn token.
- Header `Authorization: Bearer <token>`.
- Sự khác nhau giữa authentication và authorization.

### 2. Phân quyền

Backend sử dụng:

- `[Authorize]`: bắt buộc đăng nhập.
- `[Authorize(Roles = "Admin")]`: chỉ admin.
- Kiểm tra user hiện tại có sở hữu đơn hàng hay không.

Frontend có `ProtectedRoute`, nhưng kiểm tra quyền ở frontend chỉ phục vụ trải nghiệm. Backend vẫn phải kiểm tra lại mọi quyền truy cập.

### 3. Các lỗ hổng hiện tại cần nhận biết

Đây là kiến thức bắt buộc nếu muốn đưa BaseCore lên môi trường thật:

- Mật khẩu hiện đang được lưu và so sánh trực tiếp, chưa hash.
- Secret JWT còn được hard-code trong `AuthController`.
- CORS đang dùng `AllowAnyOrigin`, `AllowAnyMethod`, `AllowAnyHeader`.
- JWT đang tắt kiểm tra issuer và audience.
- Token được lưu trong `localStorage`, cần hiểu rủi ro XSS.
- Dữ liệu đầu vào chưa có một cơ chế validation thống nhất.
- Không được commit connection string, password hoặc secret thật.

Các phần nên học và triển khai:

- Hash mật khẩu bằng ASP.NET Core `PasswordHasher` hoặc BCrypt/Argon2.
- Đưa secret vào environment variable hoặc secret manager.
- Kiểm tra issuer, audience, signing key và thời gian hết hạn.
- Giới hạn CORS theo domain.
- Validation bằng Data Annotation hoặc FluentValidation.
- Rate limiting và chống brute-force đăng nhập.
- HTTPS, security header và logging an toàn.
- Refresh token hoặc chiến lược session phù hợp.

---

## Tầng 7: Nghiệp vụ thương mại điện tử

Đây là phần quan trọng nhất để sửa đúng logic thay vì chỉ sửa cho hết lỗi biên dịch.

### 1. Danh mục và sản phẩm

Cần hiểu:

- Danh mục cha/con.
- Slug.
- Sản phẩm đang hoạt động hoặc đã xóa mềm.
- Sản phẩm nổi bật.
- Giá cơ bản.
- Biến thể theo size, màu và SKU.
- Giá bán và giá khuyến mại.
- Tồn kho.
- Tìm kiếm, lọc, sắp xếp và phân trang.

### 2. Giỏ hàng

Cần hiểu:

- Một user có một giỏ hàng đang hoạt động.
- Một dòng giỏ hàng gắn với một biến thể sản phẩm.
- Không cho số lượng vượt tồn kho.
- Snapshot tên, giá, ảnh và SKU tại thời điểm thêm vào giỏ.
- Đồng bộ giỏ hàng giữa frontend và database.

### 3. Checkout và đơn hàng

Luồng hiện tại:

1. Người dùng gửi danh sách sản phẩm và thông tin nhận hàng.
2. Backend kiểm tra sản phẩm, biến thể và tồn kho.
3. Backend tự tính giá; không tin tổng tiền frontend gửi lên.
4. Backend giảm tồn kho.
5. Backend tạo đơn hàng và chi tiết đơn hàng.
6. Toàn bộ thao tác chạy trong transaction.
7. Nếu có lỗi, transaction phải rollback.

Cần học:

- Atomic transaction.
- Race condition khi nhiều người cùng mua sản phẩm cuối.
- Concurrency token hoặc optimistic concurrency.
- Idempotency để tránh tạo hai đơn do bấm thanh toán nhiều lần.
- Snapshot dữ liệu sản phẩm trong chi tiết hóa đơn.
- Phí vận chuyển, thuế, voucher và tổng tiền.

### 4. Trạng thái đơn hàng

Các trạng thái thường có:

```text
pending -> confirmed -> shipping -> delivered
pending/confirmed -> cancelled
```

Cần quy định rõ:

- Trạng thái nào được phép chuyển sang trạng thái nào.
- Ai có quyền đổi trạng thái.
- Khi hủy đơn có hoàn tồn kho không.
- Khi xóa đơn có làm mất lịch sử đối soát không.
- Khi thanh toán thất bại thì đơn hàng xử lý thế nào.

### 5. Tài khoản, địa chỉ và yêu thích

Cần hiểu:

- Người dùng chỉ được sửa dữ liệu của chính mình.
- Một địa chỉ mặc định trên mỗi tài khoản.
- Danh sách yêu thích không được trùng cùng một sản phẩm.
- Phân biệt tài khoản customer và admin.

### 6. Đánh giá sản phẩm

Cần hiểu:

- Rating từ 1 đến 5.
- Quan hệ giữa user, product và chi tiết đơn hàng.
- Verified purchase.
- Mỗi người được đánh giá sản phẩm bao nhiêu lần.
- Kiểm duyệt nội dung và trạng thái đánh giá.

---

## Tầng 8: Logging, Audit, Cache và WebSocket

Repository còn có các thành phần cho logging, audit, Redis và WebSocket.

### 1. Logging

Cần học:

- Log level: Trace, Debug, Information, Warning, Error, Critical.
- Structured logging.
- Correlation ID giữa gateway và service.
- Không ghi password, token hoặc dữ liệu nhạy cảm vào log.
- Global exception middleware.

### 2. Audit log

Audit log trả lời:

- Ai thực hiện thao tác?
- Thao tác trên dữ liệu nào?
- Thời điểm nào?
- Giá trị trước và sau thay đổi là gì?

Đây là phần quan trọng đối với thao tác quản trị sản phẩm, người dùng và đơn hàng.

### 3. Redis cache

Một số project cũ/phụ có tham chiếu Redis. Nếu kích hoạt cache, cần hiểu:

- Cache-aside pattern.
- Cache key.
- TTL.
- Cache invalidation.
- Không cache dữ liệu phân quyền sai phạm vi user.

Không nên ghi trong tài liệu triển khai rằng API chính đã sử dụng cache nếu chưa có đoạn đăng ký và gọi Redis trong luồng đang chạy.

### 4. WebSocket

`BaseCore.Common` có thành phần WebSocket. Cần học nếu muốn làm:

- Thông báo đơn hàng theo thời gian thực.
- Dashboard cập nhật trực tiếp.
- Kết nối lâu dài giữa client và server.
- Quản lý reconnect và connection.

---

## Tầng 9: Kiểm thử và chất lượng mã nguồn

Project `BaseCore.UnitTest` sử dụng:

- NUnit.
- Moq.
- EF Core InMemory.

### 1. Kiểm thử cần biết

- Unit test.
- Integration test.
- API test.
- Arrange - Act - Assert.
- Mock dependency.
- Kiểm tra HTTP status và response.
- Kiểm tra transaction và tồn kho.

### 2. Các trường hợp quan trọng cần test

- Đăng nhập đúng và sai.
- Người dùng thường không gọi được API admin.
- Tạo đơn tính đúng giá khuyến mại và phí vận chuyển.
- Không mua vượt tồn kho.
- Hủy đơn hoàn lại tồn kho đúng một lần.
- Không truy cập đơn hàng của người khác.
- Voucher không hợp lệ không làm giảm tiền.
- Tìm kiếm và phân trang trả đúng tổng số bản ghi.
- Một người không tạo trùng favorite hoặc review trái quy tắc.

### 3. Lệnh kiểm thử

```bash
dotnet test BaseCore.UnitTest/BaseCore.UnitTest.csproj
```

Ngoài unit test, nên có integration test chạy với SQL Server test vì EF Core InMemory không mô phỏng đầy đủ constraint, transaction và hành vi SQL Server.

---

## Tầng 10: Git, cấu hình và triển khai

### 1. Git

Cần biết:

- `git status`.
- `git diff`.
- `git add`.
- `git commit`.
- Branch và merge.
- Giải quyết conflict.
- Không commit file secret hoặc file build.

### 2. Cấu hình môi trường

Cần phân biệt:

- Development.
- Testing.
- Staging.
- Production.

Các giá trị phải cấu hình theo môi trường:

- SQL Server connection string.
- JWT secret, issuer và audience.
- URL của gateway và service.
- CORS origin.
- Log level.
- Thời gian hết hạn token.

### 3. Build

Backend:

```bash
dotnet restore BaseCore.sln
dotnet build BaseCore.sln
```

Frontend:

```bash
cd BaseCore.WebClient
npm install
npm run build
```

### 4. Kiến thức triển khai nên học thêm

- Docker và Docker Compose.
- Reverse proxy bằng Nginx hoặc IIS.
- HTTPS certificate.
- CI/CD.
- Database backup và migration strategy.
- Health check.
- Monitoring và alert.

---

## Bản đồ đọc source code

Nên đọc theo thứ tự sau:

1. `BaseCore.WebClient/src/App.jsx`: route và provider của frontend.
2. `BaseCore.WebClient/src/services/api.js`: toàn bộ API frontend đang gọi.
3. `BaseCore.ApiGateway/ocelot.json`: request được chuyển tới service nào.
4. `BaseCore.APIService/Program.cs`: cấu hình API nghiệp vụ.
5. `BaseCore.AuthService/Program.cs`: cấu hình API xác thực.
6. Các file trong `BaseCore.APIService/Controllers`: endpoint và nghiệp vụ.
7. `BaseCore.Services/Authen/UserService.cs`: logic xác thực hiện tại.
8. `BaseCore.Repository/SQLServerDbContext.cs`: bảng, cột và quan hệ dữ liệu.
9. Các file trong `BaseCore.Repository/EFCore`: truy vấn dữ liệu.
10. Các file trong `BaseCore.Entities`: mô hình nghiệp vụ.
11. `BaseCore.Repository/Migrations`: lịch sử thay đổi database.
12. `BaseCore.UnitTest`: cách kiểm thử logic.

---

## Lộ trình học đề xuất

### Giai đoạn 1: Nền tảng

1. HTML.
2. CSS, Flexbox, Grid và Bootstrap.
3. JavaScript cơ bản.
4. JavaScript bất đồng bộ.
5. HTTP và REST API.
6. Git cơ bản.

### Giai đoạn 2: Frontend

1. React component, props và state.
2. React Hooks.
3. React Router.
4. Form và validation.
5. Axios.
6. Context API.
7. TanStack Query.
8. Debug bằng DevTools.

### Giai đoạn 3: Backend

1. C# cơ bản.
2. OOP, interface và generic.
3. LINQ.
4. Async/await.
5. ASP.NET Core Web API.
6. Dependency Injection.
7. JWT và authorization.
8. Swagger.

### Giai đoạn 4: Database

1. SQL Server và SQL cơ bản.
2. Thiết kế quan hệ.
3. Entity Framework Core.
4. Migration.
5. Transaction.
6. Index và tối ưu query.

### Giai đoạn 5: Đọc và sửa BaseCore

1. Chạy Gateway, AuthService, APIService và WebClient.
2. Theo dõi một request từ React đến database.
3. Sửa một chức năng CRUD đơn giản.
4. Sửa luồng giỏ hàng.
5. Sửa luồng checkout và trạng thái đơn.
6. Viết unit test.
7. Tách business logic khỏi controller.
8. Khắc phục các vấn đề bảo mật.

### Giai đoạn 6: Production

1. Hash mật khẩu.
2. Quản lý secret.
3. Validation tập trung.
4. Logging và exception handling.
5. Integration test.
6. Docker.
7. CI/CD.
8. Monitoring, backup và bảo mật triển khai.

---

## Mục tiêu cuối cùng

Bạn được xem là đã làm chủ BaseCore khi có thể:

- Giải thích được request đi qua những project nào.
- Thêm một API mới đúng tầng.
- Thêm migration mà không làm mất dữ liệu.
- Phân quyền đúng ở backend.
- Sửa frontend và kết nối API.
- Debug lỗi từ browser, gateway, service đến SQL Server.
- Viết test cho nghiệp vụ quan trọng.
- Nhận ra các rủi ro bảo mật và dữ liệu.
- Build và triển khai hệ thống theo từng môi trường.

Không cần học toàn bộ cùng lúc. Hãy đi theo một luồng hoàn chỉnh, ví dụ **đăng nhập -> xem sản phẩm -> thêm giỏ hàng -> checkout -> xem đơn**, rồi mở rộng sang quản trị, kiểm thử và bảo mật.
