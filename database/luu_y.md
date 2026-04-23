## Lưu Ý Triển Khai Production

- **Dùng UUID** cho `users.id` thay vì BIGINT nếu cần phòng tránh enumeration attack
- **Index bắt buộc:** `email` (users), `slug` (products), `order_code` (bills), `bill_id` + `product_id` (bill_details), `user_id` + `status` (bills)
- **Soft delete** (`deleted_at`) thay vì xóa thật cho products, users
- **Snapshot dữ liệu** trong `bill_details` và `shipping_address_snapshot` để lịch sử đơn hàng không bị sai khi cập nhật sau
- **Tách `payments`** khỏi `bills` để một đơn có thể có nhiều lần thanh toán (trả góp, hoàn tiền một phần)
- **`inventory_transactions`** đảm bảo tồn kho có thể tái tính toán và audit, không chỉ dựa vào con số `stock_quantity`

***

### Dưới đây là thứ tự triển khai được sắp xếp theo **mức độ phụ thuộc kỹ thuật** và **giá trị chấm điểm**, chia thành 4 giai đoạn rõ ràng.

***

## Nguyên Tắc Ưu Tiên

Bảng nào **không có FK** thì tạo trước. Bảng nào **nhiều FK nhất** thì tạo sau. Tính năng nào **giám khảo chắc chắn hỏi** thì làm kỹ hơn.

***

## Giai Đoạn 1 — Nền Tảng Bắt Buộc *(Làm trước tiên)*

Đây là bộ khung tối thiểu để hệ thống có thể chạy được. Không có nhóm này, mọi bảng khác đều không tồn tại được.

**Thứ tự tạo bảng (theo FK dependency):**

```
1.  product_types        (không có FK)
2.  suppliers            (không có FK)
3.  collections          (không có FK)
4.  users                (không có FK)
5.  products             (FK → product_types, suppliers, collections)
6.  product_variants     (FK → products)
7.  user_addresses       (FK → users)
8.  carts                (FK → users)
9.  cart_items           (FK → carts, product_variants)
10. bills                (FK → users)
11. bill_details         (FK → bills, product_variants)
```

**Tại sao nhóm này quan trọng nhất:**
- Bao gồm đúng 4 bảng yêu cầu trong đề bài: `products`, `product_types`, `product_variants` (production), `bills`, `bill_details`
- Đủ để demo luồng chính: **Xem sản phẩm → Thêm giỏ → Đặt hàng**

***

## Giai Đoạn 2 — Tính Năng Cốt Lõi *(Làm ngay sau giai đoạn 1)*

Giai đoạn này hoàn thiện hệ thống đủ để chấm điểm tốt và demo được toàn bộ user journey.

```
12. product_images       (FK → products)
13. product_attributes   (FK → products)
14. reviews              (FK → users, products, bill_details)
15. review_images        (FK → reviews)
16. review_replies       (FK → reviews, users)
17. order_status_logs    (FK → bills, users)
18. admin_logs           (FK → users)
19. notifications        (FK → users)
```

**Tại sao làm sớm:**
- `reviews` là bảng **yêu cầu trong đề** (nhận xét) — giám khảo sẽ hỏi thẳng
- `order_status_logs` chứng minh bạn hiểu **audit trail** — điểm cộng kỹ thuật
- `admin_logs` thể hiện rõ vai trò **admin** trong yêu cầu đề bài

***

## Giai Đoạn 3 — Tính Năng Nâng Cao *(Làm khi đã xong giai đoạn 2)*

Nhóm này nâng điểm đồ án từ trung bình lên khá/giỏi, thể hiện tư duy thiết kế production.

```
20. coupons              (không có FK)
21. coupon_usages        (FK → coupons, users, bills)
22. flash_sales          (không có FK)
23. flash_sale_items     (FK → flash_sales, product_variants)
24. payment_transactions (FK → bills)
25. shipments            (FK → bills)
26. wishlists            (FK → users, products)
27. password_reset_tokens(FK → users)
```

**Tại sao làm sau:**
- Coupon/flash sale phụ thuộc vào luồng đặt hàng đã ổn định
- `payment_transactions` cần `bills` hoàn chỉnh mới có ý nghĩa
- `password_reset_tokens` là tính năng phụ, không ảnh hưởng luồng chính

***

## Giai Đoạn 4 — Hoàn Thiện & Điểm Thưởng *(Nếu còn thời gian)*

```
28. tags + product_tags      Lọc sản phẩm linh hoạt
29. inventory_transactions   Audit trail tồn kho
30. search_logs              Phân tích hành vi người dùng
31. banners                  Quản lý giao diện trang chủ
32. settings                 Cấu hình hệ thống động
```

> Những bảng này **không bắt buộc** nhưng khi giám khảo hỏi "hệ thống có thể deploy thật không?" — đây là thứ bạn đưa ra để trả lời "có".

***

## Bảng Tóm Tắt Ưu Tiên

| Giai đoạn | Số bảng | Mức độ | Kết quả đạt được |
|---|---|---|---|
| **1 — Nền tảng** | 11 bảng | Bắt buộc | Chạy được luồng chính, đủ điều kiện nộp |
| **2 — Cốt lõi** | 8 bảng | Quan trọng | Demo đầy đủ, đủ điểm khá |
| **3 — Nâng cao** | 8 bảng | Nên có | Thể hiện tư duy production, điểm giỏi |
| **4 — Hoàn thiện** | 5 bảng | Bonus | Trả lời được câu hỏi khó của giám khảo |

***

## Những Điểm Giám Khảo Hay Hỏi

- **"Tại sao dùng snapshot trong `bill_details`?"** → Vì giá/tên sản phẩm có thể thay đổi sau khi đặt hàng, lịch sử đơn phải bất biến
- **"Làm sao tránh 1 user review 2 lần?"** → `bill_detail_id` là FK bắt buộc + UNIQUE constraint trên `(user_id, bill_detail_id)` trong bảng `reviews`
- **"Tồn kho xử lý thế nào khi nhiều người mua cùng lúc?"** → `SELECT FOR UPDATE` hoặc optimistic locking với cột `version` trong `product_variants`
- **"Phân quyền admin và staff khác gì?"** → Cột `role` trong `users` kết hợp với `admin_logs` kiểm soát hành động, staff chỉ xử lý đơn hàng còn admin mới chỉnh sản phẩm/người dùng