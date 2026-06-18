# Thiết kế lại Admin Layout, Dashboard và Tích hợp Quản lý Thanh toán

Kế hoạch này đề xuất tái thiết kế toàn bộ hệ thống quản trị (Admin Dashboard) của dự án **BaseCore Sales**, nâng cấp UX/UI sang phong cách hiện đại (không phụ thuộc vào jQuery và AdminLTE 3) và tích hợp thêm mô-đun **Quản lý Thanh toán (Payment Management)**.

## User Review Required

> [!IMPORTANT]
> - **Thay thế hoàn toàn AdminLTE 3 & jQuery**: Chuyển sang sử dụng CSS Grid, CSS Flexbox và CSS Variables hiện đại, bo góc mềm mại, độ tương phản cao để thay thế giao diện Bootstrap 4 cũ kỹ.
> - **Biểu đồ trực quan bằng SVG thuần**: Xây dựng các component biểu đồ doanh thu và cơ cấu thanh toán bằng SVG động trực tiếp trong React để giảm tải cho bundle size và tránh lỗi xung đột thư viện bên thứ ba.
> - **Mô phỏng Dữ liệu Thanh toán (Mock Payment Data)**: Tạo cơ sở dữ liệu mô phỏng cho các giao dịch (Transactions), cổng thanh toán (Payment Gateways), và log đối soát ở client để có giao diện hoạt động đầy đủ tính năng trước khi đấu nối hoàn toàn vào database/backend thật.

## Open Questions

> [!IMPORTANT]
> 1. Bạn muốn biểu đồ doanh thu trên Dashboard hiển thị theo dạng cột (Bar Chart) hay dạng đường (Line Chart)?
> 2. Các thông tin cấu hình nhạy cảm (như Secret Key của VNPAY/MoMo/PayPal) có cần cơ chế phân quyền chỉ Super Admin mới nhìn thấy và chỉnh sửa được hay không?

## Proposed Changes

### 1. Nâng cấp Layout & Dashboard

#### [MODIFY] [AdminLayout.jsx](file:///d:/Code/Project_Web_nam3_ky2/BaseCore/BaseCore.WebClient/src/components/AdminLayout.jsx)
- Gỡ bỏ các class của AdminLTE (`main-sidebar`, `sidebar-dark-primary`, `nav-sidebar`, v.v.).
- Thay thế jQuery Treeview/PushMenu bằng React Hooks (`useState` để lưu trạng thái thu gọn sidebar, chuyển đổi menu).
- Thiết kế lại Header: bổ sung thanh tìm kiếm nhanh toàn hệ thống, Bell Notification chứa danh sách cảnh báo đơn hàng/hết hàng, và avatar tài khoản.
- Thêm đường dẫn `Payments` vào menu Configuration & Reports.

#### [MODIFY] [Dashboard.jsx](file:///d:/Code/Project_Web_nam3_ky2/BaseCore/BaseCore.WebClient/src/pages/Dashboard.jsx)
- Cải tiến lại hệ thống thống kê: Thiết kế Bento Grid cho 4 thẻ KPI hàng đầu.
- Tích hợp biểu đồ doanh số bằng SVG vẽ biểu đồ cột/đường mượt mà.
- Thiết kế lại bảng "Recent Purchases" với các trạng thái đơn hàng có màu sắc phân cấp rõ ràng, thay thế thẻ dropdown `<select>` chọn trạng thái bằng hộp xác nhận (Confirmation Modal).

### 2. Mô-đun Quản lý Thanh toán (Payment Management)

#### [NEW] [Payments.jsx](file:///d:/Code/Project_Web_nam3_ky2/BaseCore/BaseCore.WebClient/src/pages/Payments.jsx)
Tạo trang quản lý thanh toán với 3 tab chức năng:
- **Tab 1: Transactions (Giao dịch)**:
  - Bảng hiển thị danh sách giao dịch: *Mã GD, Đơn hàng, Số tiền, Phí GD, Phương thức, Trạng thái (Paid, Pending, Failed, Refunded), Thời gian*.
  - Bấm vào một dòng sẽ hiển thị Drawer bên phải chứa dòng thời gian (Timeline) giao dịch, Webhook logs thô từ cổng thanh toán, và các nút action (Duyệt hoàn tiền, Xác nhận thủ công).
- **Tab 2: Payment Gateways (Cổng thanh toán)**:
  - Danh sách các cổng thanh toán hỗ trợ (COD, Chuyển khoản, VNPAY, MoMo, PayPal).
  - Cho phép Bật/Tắt nhanh qua Toggle Switch.
  - Form chỉnh sửa thông tin API Keys, Merchant ID, Secret Key (hỗ trợ ẩn/hiện mật khẩu bảo mật) và nút "Test Connection" mô phỏng.
- **Tab 3: Reconciliation (Đối soát)**:
  - Giao diện tải file Excel/CSV sao kê ngân hàng lên để đối soát.
  - So khớp tự động và hiển thị các trường hợp bị lệch tiền hoặc sai mã giao dịch.

#### [MODIFY] [App.jsx](file:///d:/Code/Project_Web_nam3_ky2/BaseCore/BaseCore.WebClient/src/App.jsx)
- Đăng ký route mới cho trang Payments: `/admin/payments` (nằm trong Route của AdminLayout).

#### [MODIFY] [api.js](file:///d:/Code/Project_Web_nam3_ky2/BaseCore/BaseCore.WebClient/src/services/api.js)
- Định nghĩa các hàm kết nối API thanh toán (`paymentApi`) hỗ trợ lấy dữ liệu giao dịch, cập nhật cài đặt cổng thanh toán, và gửi yêu cầu hoàn tiền.

---

## Verification Plan

### Manual Verification
- Kiểm tra tính tương thích và Responsive của Admin Layout mới trên các kích thước màn hình (Desktop, Tablet, Mobile) bằng DevTools.
- Thao tác chuyển đổi tab, Bật/Tắt cổng thanh toán và chỉnh sửa API key để xem giao diện phản hồi.
- Chạy thử tính năng mô phỏng Webhook logs và đối soát file CSV để kiểm tra độ tin cậy của thuật toán so khớp dòng tiền ở Client.
