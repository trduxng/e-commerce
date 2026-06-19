Viewed interview_prep.md:1-38
Listed directory document
Viewed SYSTEM_ARCHITECTURE.md:1-70
Viewed KienThucCanCo.md:1-767

Dựa trên tài liệu hệ thống và vai trò của bạn là **phát triển phân hệ Quản trị (Admin) trên React kết nối qua Ocelot API Gateway**, dưới đây là bộ tài liệu ôn thi vấn đáp được thiết kế "thực chiến" nhất để bạn đạt điểm cao.

---

## 🧭 CÁCH GIỚI THIỆU DỰ ÁN ẤN TƯỢNG (Mở đầu)

Khi thầy cô yêu cầu: _"Em hãy giới thiệu ngắn gọn về dự án và phần việc của mình."_

> _"Kính thưa thầy cô, dự án **BaseCore** của chúng em là một hệ thống thương mại điện tử được thiết kế theo kiến trúc **Microservices** hướng dịch vụ. Trong đó, em đảm nhận vai trò **phát triển phân hệ Quản trị (Admin)**.
> Phân hệ của em được xây dựng bằng **React/Vite**, kết nối với hệ thống Backend thông qua **Ocelot API Gateway**. Em trực tiếp chịu trách nhiệm thiết kế giao diện Admin Dashboard và các module cốt lõi như: quản lý sản phẩm, điều phối đơn hàng (hỗ trợ xuất hóa đơn PDF/Excel), duyệt đánh giá của khách hàng, phân quyền người dùng (RBAC) và đặc biệt là hệ thống giám sát giỏ hàng hiện thời của khách hàng (Current Carts). Sau đây em xin phép trình bày chi tiết về luồng vận hành của hệ thống ạ."_

---

## 💬 BỘ CÂU HỎI VẤN ĐÁP THƯỜNG GẶP & CÁCH TRẢ LỜI

### 1. Nhóm câu hỏi về Kiến trúc & Gateway

**Q1: Tại sao lại dùng API Gateway (Ocelot)? Có vai trò gì?**

- **Trả lời:** Ocelot Gateway đóng vai trò là **Single Entry Point** (ngõ vào duy nhất) cho Frontend ở cổng `5000`. Thay vì Frontend phải nhớ địa chỉ IP/Port của từng Microservice, nó chỉ cần gửi request đến Gateway. Gateway sẽ đọc file `ocelot.json` để định tuyến (Route) chính xác:
  - `/api/auth/*` hoặc `/api/users/*` -> chuyển tiếp đến **AuthService** (Port `5003`).
  - `/api/products/*`, `/api/orders/*`, `/api/cart/*` -> chuyển tiếp đến **APIService** (Port `5001`).
- **Lợi ích:** Che giấu cấu trúc mạng nội bộ (Security), xử lý CORS tập trung, và có thể mở rộng Load Balancing dễ dàng.

**Q2: Dự án này có phải là Microservices hoàn chỉnh không?**

- **Trả lời:** Dự án đang ở dạng **Modular Monolith hoặc Microservices mức cơ bản (Shared Database)**. Các service (`AuthService`, `APIService`) được tách thành các ứng dụng chạy độc lập (executable) kết nối qua Gateway, giúp tách biệt tiến trình xử lý. Tuy nhiên, chúng vẫn chia sẻ chung một cơ sở dữ liệu SQL Server (`SQLServerDbContext`). Trong thực tế để đạt Microservices hoàn chỉnh, mỗi dịch vụ nên sở hữu một database riêng biệt và giao tiếp bất đồng bộ qua Message Broker (RabbitMQ/Kafka).

---

### 2. Nhóm câu hỏi về Xác thực & Phân quyền (JWT & RBAC)

**Q3: Cơ chế đăng nhập và phân quyền Admin được triển khai thế nào?**

- **Trả lời:** Hệ thống sử dụng cơ chế **JWT (JSON Web Token)** kết hợp phân quyền theo vai trò (**RBAC - Role-Based Access Control**):
  1.  User gửi tài khoản/mật khẩu -> Gateway -> `AuthService`.
  2.  `AuthService` xác thực, tạo một chuỗi JWT chứa các thông tin (`Claims`) bao gồm: ID, Email và **Role** (ví dụ: `admin` hoặc `customer`).
  3.  Frontend nhận JWT, lưu vào `localStorage`. Các request tiếp theo gửi qua Axios sẽ tự động gắn token vào header `Authorization: Bearer <token>`.
  4.  Ở phía **Backend**: Các controller được bảo vệ bằng attribute `[Authorize(Roles = "admin")]` để từ chối các request không hợp lệ.
  5.  Ở phía **Frontend**: Trang Admin được bảo vệ bởi component `ProtectedRoute.jsx` để kiểm tra quyền và ngăn chặn user thường truy cập.

**Q4: Token JWT lưu ở `localStorage` có an toàn không? Có cách nào bảo mật hơn?**

- **Trả lời:** Lưu JWT ở `localStorage` dễ bị tấn công **XSS (Cross-Site Scripting)** nếu mã độc JavaScript đọc được. Cách an toàn hơn là lưu JWT vào **HttpOnly Cookie** (với cờ `Secure` và `SameSite`), lúc này JavaScript phía client sẽ không thể truy cập trực tiếp vào token.

---

### 3. Nhóm câu hỏi về Frontend & Axios

**Q5: Em cấu hình Axios gọi API như thế nào để xử lý token và lỗi hệ thống?**

- **Trả lời:** Em cấu hình tập trung trong file `src/services/api.js`:
  - **Request Interceptor:** Tự động lấy token từ `localStorage` đính kèm vào header mỗi khi gửi request.
  - **Response Interceptor:**
    - Tự động bắt lỗi **401 (Unauthorized)** để xóa token quá hạn và chuyển hướng người dùng về trang `/login`.
    - Tích hợp cơ chế **Retry** (thử lại): Với các request `GET` bị lỗi mạng hoặc lỗi Server (status `>= 500`), hệ thống sẽ tự động gọi lại tối đa 2 lần trước khi báo lỗi ra màn hình.

---

### 4. Nhóm câu hỏi về Database & Nghiệp vụ Admin

**Q6: Luồng đặt hàng (Checkout & Order) hoạt động thế nào dưới Database?**

- **Trả lời:** Đây là luồng quan trọng cần tính toàn vẹn dữ liệu. Khi khách hàng nhấn checkout, hệ thống thực hiện một **Database Transaction (Atomic)**:
  1.  Tạo bản ghi đơn hàng mới trong bảng `Order`.
  2.  Tạo các bản ghi chi tiết đơn hàng trong bảng `OrderDetail` (lưu snapshot của sản phẩm tại thời điểm mua để tránh việc sản phẩm đổi giá/tên trong tương lai làm sai lệch hóa đơn).
  3.  Cập nhật giảm số lượng tồn kho (`StockQuantity`) trong bảng `ProductVariant`.
  4.  Nếu một trong các bước trên thất bại, toàn bộ tiến trình sẽ được **Rollback** để đảm bảo không bị lỗi sai lệch dữ liệu. Nếu thành công, hệ thống mới **Commit** và xóa giỏ hàng.

**Q7: Chức năng "Giám sát giỏ hàng hiện tại" (Current Carts) có ý nghĩa gì?**

- **Trả lời:** Chức năng này cho phép Admin xem danh sách các giỏ hàng đang có sản phẩm của tất cả khách hàng trong thời gian thực. Giúp bộ phận vận hành phân tích sản phẩm nào đang được quan tâm nhiều nhưng chưa thanh toán, hỗ trợ chăm sóc khách hàng hoặc đưa ra chiến dịch khuyến mại (Coupon) kịp thời.

**Q8: Em sử dụng thư viện nào để xuất hóa đơn PDF và Excel?**

- **Trả lời:**
  - **PDF:** Sử dụng thư viện `jspdf` kết hợp `jspdf-autotable` để vẽ bảng thông tin hóa đơn và xuất file.
  - **Excel:** Sử dụng thư viện `xlsx` (SheetJS) để chuyển đổi dữ liệu mảng đơn hàng thành tệp spreadsheet và tải xuống trực tiếp trên trình duyệt.

---

## ⚠️ CÁCH ỨNG PHÓ KHI BỊ "HỎI XOÁY" (Critical Tips)

Nếu thầy cô hỏi: _"Dự án này của em có điểm yếu gì chưa hoàn thiện hoặc cần cải tiến?"_
👉 **Hãy thẳng thắn thừa nhận và đưa ra giải pháp kỹ thuật cụ thể để ghi điểm tuyệt đối:**

1.  **Mật khẩu người dùng:** Hiện tại mật khẩu đang lưu trực tiếp (PlainText) dưới Database. _Giải pháp cải tiến:_ Cần áp dụng cơ chế Hash mật khẩu bằng **BCrypt** hoặc **PBKDF2** trước khi lưu.
2.  **Thông tin nhạy cảm:** Connection String và Secret Key của JWT vẫn đang hardcode trong file cấu hình. _Giải pháp cải tiến:_ Cần chuyển sang sử dụng **Environment Variables (Biến môi trường)** hoặc các dịch vụ quản lý như Azure Key Vault.
3.  **Giao tiếp giữa các Service:** Đang gọi đồng bộ qua HTTP. _Giải pháp cải tiến:_ Nếu một service sập thì luồng sẽ gãy. Nên chuyển các tác vụ như gửi email xác nhận đặt hàng, ghi log sang xử lý bất đồng bộ qua **Message Queue** (RabbitMQ).

---

## 🛠️ CÁC BƯỚC CHUẨN BỊ TRƯỚC GIỜ G

1.  **Khởi động sẵn Backend & Frontend:** Chạy trước Gateway, AuthService, APIService và React Web Client.
2.  **Mở sẵn Database:** Mở SQL Server Management Studio (SSMS), chuẩn bị sẵn một số câu query SELECT bảng `Users`, `Products`, `Orders` để nếu thầy cô bảo chỉ ra dữ liệu thay đổi thế nào thì chạy ngay.
3.  **Tập duyệt Demo:** Chuẩn bị sẵn 1 tài khoản Admin và 1 tài khoản Customer trên 2 trình duyệt khác nhau (hoặc 1 thường, 1 ẩn danh) để biểu diễn luồng: _Customer đặt hàng -> Admin nhận được đơn hàng và duyệt trạng thái đơn hàng._
