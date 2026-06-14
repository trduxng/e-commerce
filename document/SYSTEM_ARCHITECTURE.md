# 🏗️ Kiến trúc & Luồng hoạt động Hệ thống BaseCore

Tài liệu này giải thích cách các thành phần trong hệ thống tương tác với nhau và quy trình xử lý nghiệp vụ chính.

---

## 1. Sơ đồ Tổng quát (High-Level Architecture)

Hệ thống được thiết kế theo mô hình **Microservices** kết hợp **API Gateway**:

1.  **Frontend (React/Vite):** Giao diện người dùng cuối và quản trị.
2.  **API Gateway (Ocelot):** Cửa ngõ duy nhất (Entry point) điều phối các yêu cầu.
3.  **Backend Services:**
    *   **AuthService:** Quản lý định danh, đăng nhập, cấp JWT Token.
    *   **APIService:** Xử lý nghiệp vụ chính (Sản phẩm, Đơn hàng, Danh mục).
    *   **LogService/AuditLog:** Ghi vết hoạt động và nhật ký lỗi.
4.  **Database Layer:**
    *   **SQL Server:** Lưu trữ dữ liệu quan hệ (Users, Products, Bills).
    *   **Redis:** Caching dữ liệu để tối ưu tốc độ.

---

## 2. Các Quy trình Chính (Core Workflows)

### 🔑 A. Luồng Xác thực (Authentication Flow)
1.  **Client** gửi `Username/Password` tới Gateway.
2.  **Gateway** điều hướng tới **AuthService**.
3.  **AuthService** kiểm tra DB -> Trả về **JWT Token**.
4.  **Client** lưu Token vào `localStorage` và đính kèm vào Header `Authorization` cho các yêu cầu sau.

### 🛒 B. Luồng Catalog & Tìm kiếm (Product Flow)
1.  **Client** yêu cầu danh sách sản phẩm qua Gateway.
2.  **APIService** nhận lệnh -> Kiểm tra **Redis Cache**.
    *   Nếu có: Trả về ngay.
    *   Nếu không: Truy vấn **SQL Server** -> Lưu vào Redis -> Trả về Client.

### 🧾 C. Luồng Đặt hàng & Hóa đơn (Order Flow)
Đây là luồng quan trọng nhất, đảm bảo tính nhất quán dữ liệu:
1.  **Giai đoạn Checkout:** User gửi thông tin giỏ hàng lên APIService.
2.  **Atomic Transaction (Giao dịch):**
    *   Tạo bản ghi đơn hàng trong bảng `orders.bills`.
    *   Tạo chi tiết món hàng trong bảng `orders.bill_details`.
    *   Cập nhật giảm số lượng tồn kho trong `catalog.product_variants`.
    *   *Nếu có bất kỳ bước nào lỗi, hệ thống tự động Rollback (hủy bỏ) toàn bộ để tránh sai lệch.*
3.  **Kết quả:** Trả về mã hóa đơn (`OrderCode`) cho người dùng.

### 🛡️ D. Luồng Quản trị (Admin Flow)
1.  **Phân quyền:** Gateway/Backend kiểm tra Claims trong JWT để xác định quyền `Admin`.
2.  **Xử lý Hóa đơn:** Admin cập nhật trạng thái đơn hàng (Duyệt/Giao hàng/Hủy).
3.  **Lịch sử (Timeline):** Mỗi thay đổi trạng thái được ghi lại vào `OrderStatusLog` để đối soát.

---

## 3. Hệ thống Ghi nhật ký (Logging & Audit)

Mọi biến động trong hệ thống được theo dõi chặt chẽ:
*   **LogAction:** Lưu vết "Ai đã làm gì?" (Ví dụ: Admin A xóa Sản phẩm B).
*   **LogError:** Tự động bắt các lỗi Server (Exception) và lưu lại để Debug.

---

## 4. Tại sao sử dụng API Gateway?

*   **Single Point of Entry:** Frontend chỉ cần gọi tới một địa chỉ duy nhất.
*   **Security:** Ẩn các Service nội bộ bên trong mạng ảo, chỉ Gateway được lộ diện ra ngoài.
*   **Load Balancing:** Có khả năng chia tải cho các Service nếu hệ thống mở rộng.

---
*Tài liệu được khởi tạo ngày 04/05/2026 bởi Gemini CLI.*
