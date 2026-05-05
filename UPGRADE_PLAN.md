# 🗺️ Lộ trình Nâng cấp Hệ thống BaseCore (Phiên bản Chuyên sâu)

Tài liệu này chi tiết hóa các bước thực hiện để hoàn thiện hệ thống BaseCore đạt chuẩn Production-ready.

---

## 🏁 Giai đoạn 1: Chuẩn hóa Vận hành & DevOps
- [x] **Database Automation:** Triển khai `DbInitializer` để tự động hóa quá trình Migration và Seed Data.

## 🛒 Giai đoạn 2: Hoàn thiện Trải nghiệm Người dùng cuối (User Frontend)
**Mục tiêu:** Xây dựng Storefront chuyên nghiệp với luồng mua hàng khép kín.
- [x] **Tìm kiếm sản phẩm thông minh:**
  - Lọc theo >= 3 tiêu chí: Tên (Debounce), Khoảng giá (Min-Max), Danh mục.
  - Sử dụng **Dynamic Query** ở Backend để xử lý nhiều tiêu chí lọc linh hoạt.
- [x] **Quản lý giỏ hàng:**
  - Chức năng tăng/giảm số lượng và xóa sản phẩm.
  - **Stock Validation:** Kiểm tra tồn kho thời gian thực khi thêm vào giỏ.
- [x] **Quy trình Đặt hàng & Thanh toán:**
  - **Atomic Transaction:** Đảm bảo `Bill`, `BillDetail` và `Stock Update` được thực hiện đồng thời hoặc không gì cả.
  - Sinh mã hóa đơn bảo mật (Ví dụ: `INV-20240504-XXXX`).
  - Tích hợp cổng thanh toán Sandbox.

## 🛡️ Giai đoạn 3: Quản trị Hệ thống Toàn diện (Admin Frontend)
**Mục tiêu:** Quản lý tập trung, an toàn dữ liệu và tối ưu hiệu suất.
- [x] **Phân quyền & Điều hướng:**
  - Tách biệt hoàn toàn route Admin với tiền tố `/admin`.
  - Sử dụng Layout Dashboard riêng biệt cho Quản trị viên.
- [x] **Giải quyết Hóa đơn:**
  - Giao diện duyệt đơn kèm **Order Timeline** (Lưu lịch sử thay đổi trạng thái).
- [x] **Tìm kiếm Quản trị nâng cao:**
  - Lọc theo: Từ ngày - Đến ngày, Ngày sản xuất, Trạng thái đơn và thông tin khách hàng.
- [x] **Bảo vệ Dữ liệu:**
  - Xây dựng **Custom Confirm Modal** cho toàn bộ thao tác CUD (Create/Update/Delete).
  - Yêu cầu xác nhận đặc biệt cho các hành động nhạy cảm (Xóa vĩnh viễn, Hoàn tiền).

## 🎨 Giai đoạn 4: Tối ưu Kiến trúc & Chất lượng
- [x] **TypeScript Migration:** Chuyển đổi toàn bộ logic quan trọng sang `.tsx` (Đã thiết lập cấu hình tsconfig, dependencies).
- [x] **State Management:** Áp dụng `TanStack Query` để tối ưu hóa hiệu suất load và caching (Đã cài đặt QueryClientProvider).
- [x] **Quality Assurance:** Viết Unit Test cho logic tính tiền (Bill) và xử lý giao dịch.

**LƯU ý:** vừa làm vừa tự debug - test để kiêm tra xem có hoạt động hay dính lỗi không 

---
*Kế hoạch được cập nhật ngày 04/05/2026.*
