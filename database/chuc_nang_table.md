Dưới đây là tác dụng chi tiết của từng bảng và mối quan hệ với các bảng khác trong hệ thống.

***

# 🔐 SCHEMA: `auth`

***

### `auth.users`
**Tác dụng:** Bảng trung tâm của toàn hệ thống. Lưu danh tính duy nhất của mọi người dùng — customer, staff, admin đều ở đây.

**Quan hệ với bảng khác:**
- ← Được tham chiếu bởi **hầu hết mọi bảng** trong hệ thống thông qua `user_id` hoặc `admin_id`
- → `user_addresses` — 1 user có nhiều địa chỉ giao hàng
- → `orders.bills` — 1 user có nhiều đơn hàng
- → `orders.carts` — 1 user có giỏ hàng
- → `reviews.reviews` — 1 user viết nhiều đánh giá
- → `operations.wishlists` — 1 user yêu thích nhiều sản phẩm
- → `operations.notifications` — 1 user nhận nhiều thông báo
- → `auth.admin_logs` — admin/staff bị ghi lại mọi hành động

***

### `auth.user_addresses`
**Tác dụng:** Lưu danh sách địa chỉ giao hàng của từng user. Cho phép chọn địa chỉ khi đặt hàng thay vì nhập lại mỗi lần.

**Quan hệ:**
- → `auth.users` (FK: `user_id`) — thuộc về 1 user
- ← `orders.bills` **KHÔNG** FK trực tiếp — bills lưu **snapshot** địa chỉ (`shipping_address_full`) để tránh sai lệch khi user sau này xoá/sửa địa chỉ

***

### `auth.admin_logs`
**Tác dụng:** Ghi lại toàn bộ hành động nhạy cảm của admin/staff. Biết được ai làm gì, lúc nào, thay đổi gì (old_value → new_value dạng JSON).

**Quan hệ:**
- → `auth.users` (FK: `admin_id`) — ai thực hiện hành động
- Bảng này **chỉ ghi thêm, không bao giờ sửa/xoá** (append-only audit trail)

***

### `auth.password_reset_tokens`
**Tác dụng:** Lưu token tạm thời để xác thực yêu cầu đặt lại mật khẩu. Token chỉ dùng được 1 lần và có thời hạn.

**Quan hệ:**
- → `auth.users` (FK: `user_id`) — token thuộc về user nào
- Không có bảng nào FK vào bảng này

***

# 📦 SCHEMA: `catalog`

***

### `catalog.product_types`
**Tác dụng:** Danh mục sản phẩm dạng cây (Thời trang → Áo → Áo polo). Cho phép lọc sản phẩm theo nhóm ngành hàng.

**Quan hệ:**
- → chính nó (FK: `parent_id`) — self-reference tạo cây phân cấp không giới hạn tầng
- ← `catalog.products` (FK: `product_type_id`) — mỗi sản phẩm thuộc 1 danh mục

***

### `catalog.suppliers`
**Tác dụng:** Quản lý thông tin nhà cung cấp/đối tác. Biết sản phẩm nào đến từ nguồn nào để liên hệ khi cần nhập thêm hoặc xử lý khiếu nại.

**Quan hệ:**
- ← `catalog.products` (FK: `supplier_id`) — nhiều sản phẩm từ 1 nhà cung cấp

***

### `catalog.collections`
**Tác dụng:** Nhóm sản phẩm theo chủ đề hoặc mùa (Summer 2025, New Arrivals). Có thời hạn bắt đầu/kết thúc để tự động ẩn khi hết mùa.

**Quan hệ:**
- ← `catalog.products` (FK: `collection_id`) — nhiều sản phẩm thuộc 1 bộ sưu tập

***

### `catalog.products`
**Tác dụng:** Bảng trung tâm của nhóm catalog. Lưu thông tin chung của sản phẩm (tên, mô tả, giá tham chiếu). **Không** lưu tồn kho hay giá cụ thể — phần đó thuộc `product_variants`.

**Quan hệ:**
- → `catalog.product_types` — thuộc danh mục nào
- → `catalog.collections` — thuộc bộ sưu tập nào
- → `catalog.suppliers` — từ nhà cung cấp nào
- ← `catalog.product_variants` — 1 sản phẩm có nhiều biến thể
- ← `catalog.product_images` — 1 sản phẩm có nhiều ảnh
- ← `catalog.product_attributes` — 1 sản phẩm có nhiều thuộc tính
- ← `catalog.product_tags` — 1 sản phẩm có nhiều nhãn
- ← `reviews.reviews` — nhận đánh giá từ người mua
- ← `operations.wishlists` — được yêu thích bởi users

***

### `catalog.product_variants`
**Tác dụng:** Lưu từng biến thể cụ thể (size M màu đỏ, size L màu xanh). Mỗi biến thể có SKU riêng, giá riêng, tồn kho riêng. **Đây là thứ khách thực sự mua**.

**Quan hệ:**
- → `catalog.products` (FK: `product_id`) — thuộc sản phẩm nào
- ← `orders.cart_items` — khách thêm variant vào giỏ
- ← `orders.bill_details` — variant được mua trong đơn hàng
- ← `promotions.flash_sale_items` — variant tham gia flash sale
- ← `operations.inventory_transactions` — mọi biến động tồn kho được ghi lại

***

### `catalog.product_images`
**Tác dụng:** Lưu nhiều ảnh cho 1 sản phẩm. Phân biệt ảnh thumbnail chính (`is_primary`) và ảnh gallery phụ.

**Quan hệ:**
- → `catalog.products` (FK: `product_id`) — ảnh của sản phẩm nào

***

### `catalog.product_attributes`
**Tác dụng:** Lưu thuộc tính dạng key-value linh hoạt ("Chất liệu": "Cotton", "Xuất xứ": "Việt Nam"). Không cần thêm cột mới vào bảng khi có thuộc tính mới.

**Quan hệ:**
- → `catalog.products` (FK: `product_id`) — thuộc tính của sản phẩm nào

***

### `catalog.tags` + `catalog.product_tags`
**Tác dụng:** `tags` định nghĩa nhãn ("hot", "new", "sale"). `product_tags` là bảng trung gian tạo quan hệ nhiều-nhiều giữa sản phẩm và nhãn.

**Quan hệ:**
- `product_tags` → `catalog.products` và → `catalog.tags`
- 1 sản phẩm có nhiều tag, 1 tag gắn được nhiều sản phẩm

***

# 🛒 SCHEMA: `orders`

***

### `orders.carts`
**Tác dụng:** Đại diện cho "phiên mua hàng" của 1 người. Hỗ trợ cả user đăng nhập (`user_id`) và khách vãng lai (`session_token`).

**Quan hệ:**
- → `auth.users` (FK: `user_id`, nullable) — giỏ của user đã đăng nhập
- ← `orders.cart_items` — chứa các sản phẩm trong giỏ

***

### `orders.cart_items`
**Tác dụng:** Từng dòng sản phẩm trong giỏ hàng. Lưu `price_snapshot` vì giá sản phẩm có thể thay đổi trong khi khách đang duyệt.

**Quan hệ:**
- → `orders.carts` (FK: `cart_id`)
- → `catalog.product_variants` (FK: `product_variant_id`) — mua variant nào, bao nhiêu cái

***

### `orders.bills`
**Tác dụng:** Đơn hàng đã được xác nhận. Lưu **snapshot toàn bộ** thông tin giao hàng tại thời điểm đặt để lịch sử không bao giờ bị sai dù user sau này thay đổi địa chỉ.

**Quan hệ:**
- → `auth.users` (FK: `user_id`, nullable) — đơn của user nào
- ← `orders.bill_details` — chi tiết từng sản phẩm trong đơn
- ← `orders.order_status_logs` — lịch sử trạng thái đơn
- ← `payment.payment_transactions` — giao dịch thanh toán liên quan
- ← `payment.shipments` — thông tin vận chuyển
- ← `promotions.coupon_usages` — coupon được dùng trong đơn này

***

### `orders.bill_details`
**Tác dụng:** Từng dòng sản phẩm trong đơn hàng đã đặt. Lưu snapshot (`product_name_snapshot`, `sku_snapshot`, `size_snapshot`) để hóa đơn lịch sử không bị ảnh hưởng khi sản phẩm thay đổi sau này.

**Quan hệ:**
- → `orders.bills` (FK: `bill_id`)
- → `catalog.product_variants` (FK: `product_variant_id`) — mua variant nào
- ← `reviews.reviews` — chỉ từ bill_detail đã giao mới được review

***

### `orders.order_status_logs`
**Tác dụng:** Ghi lại mọi lần thay đổi trạng thái đơn hàng (pending → confirmed → shipping → delivered). Cho phép khách theo dõi tiến độ và admin tra cứu khi có khiếu nại.

**Quan hệ:**
- → `orders.bills` (FK: `bill_id`)
- → `auth.users` (FK: `created_by`) — ai thay đổi trạng thái

***

# 💬 SCHEMA: `reviews`

***

### `reviews.reviews`
**Tác dụng:** Đánh giá sản phẩm từ người đã mua thật sự. Liên kết với `bill_detail_id` để đảm bảo chỉ người mua mới review được, không thể review 2 lần cho cùng 1 sản phẩm trong 1 đơn.

**Quan hệ:**
- → `auth.users` — ai viết
- → `catalog.products` — đánh giá sản phẩm nào
- → `orders.bill_details` — chứng minh đã mua (verified purchase)
- ← `reviews.review_images` — ảnh đính kèm
- ← `reviews.review_replies` — admin phản hồi

***

### `reviews.review_images`
**Tác dụng:** Ảnh minh chứng trong đánh giá (hình thực tế của sản phẩm khi nhận hàng).

**Quan hệ:**
- → `reviews.reviews` (FK: `review_id`)

***

### `reviews.review_replies`
**Tác dụng:** Admin/staff phản hồi công khai dưới đánh giá của khách, thể hiện sự chăm sóc khách hàng.

**Quan hệ:**
- → `reviews.reviews` (FK: `review_id`)
- → `auth.users` (FK: `admin_id`) — staff/admin nào reply

***

# 🎁 SCHEMA: `promotions`

***

### `promotions.coupons`
**Tác dụng:** Định nghĩa mã giảm giá với đầy đủ điều kiện (loại giảm, giá trị, ngưỡng đơn tối thiểu, số lần dùng tối đa, thời hạn).

**Quan hệ:**
- ← `promotions.coupon_usages` — lịch sử ai dùng mã này

***

### `promotions.coupon_usages`
**Tác dụng:** Ghi lại mỗi lần coupon được áp dụng thành công. Dùng để kiểm tra user đã dùng mã này chưa và tổng số lần mã được dùng.

**Quan hệ:**
- → `promotions.coupons` (FK: `coupon_id`)
- → `auth.users` (FK: `user_id`) — ai dùng
- → `orders.bills` (FK: `bill_id`) — dùng trong đơn nào

***

### `promotions.flash_sales` + `promotions.flash_sale_items`
**Tác dụng:** `flash_sales` định nghĩa khung giờ khuyến mãi. `flash_sale_items` xác định từng biến thể tham gia, giá flash và số lượng giới hạn.

**Quan hệ:**
- `flash_sale_items` → `promotions.flash_sales`
- `flash_sale_items` → `catalog.product_variants` — variant nào được giảm

***

# 💳 SCHEMA: `payment`

***

### `payment.payment_transactions`
**Tác dụng:** Ghi lại từng giao dịch với cổng thanh toán. Lưu `gateway_response` (JSON đầy đủ) để đối soát khi có tranh chấp. 1 đơn có thể có nhiều giao dịch (thử lại, hoàn tiền).

**Quan hệ:**
- → `orders.bills` (FK: `bill_id`) — thanh toán cho đơn nào

***

### `payment.shipments`
**Tác dụng:** Theo dõi hành trình vật lý của đơn hàng từ kho đến tay khách. Lưu mã tracking để khách tự tra cứu với đơn vị vận chuyển.

**Quan hệ:**
- → `orders.bills` (FK: `bill_id`) — vận chuyển cho đơn nào

***

# 📊 SCHEMA: `operations`

***

### `operations.wishlists`
**Tác dụng:** Danh sách sản phẩm khách muốn mua sau. Dùng để gợi ý mua hàng hoặc thông báo khi sản phẩm yêu thích có khuyến mãi.

**Quan hệ:**
- → `auth.users` (FK: `user_id`)
- → `catalog.products` (FK: `product_id`)
- UNIQUE(`user_id`, `product_id`) — không thêm trùng

***

### `operations.notifications`
**Tác dụng:** Hộp thông báo trong app. Gửi khi đặt hàng thành công, đơn được giao, review được duyệt, hoặc sản phẩm yêu thích có sale.

**Quan hệ:**
- → `auth.users` (FK: `user_id`) — gửi cho ai

***

### `operations.banners`
**Tác dụng:** Quản lý banner quảng cáo trên trang chủ mà admin có thể thay đổi nội dung không cần deploy lại code. Sắp xếp thứ tự hiển thị qua `sort_order`.

**Quan hệ:** Không FK đến bảng khác — bảng độc lập hoàn toàn.

***

### `operations.settings`
**Tác dụng:** Cấu hình hệ thống dạng key-value. Admin thay đổi tên site, ngưỡng miễn ship, bật/tắt bảo trì ngay lập tức mà không cần sửa code.

**Quan hệ:** Không FK — bảng độc lập hoàn toàn.

***

### `operations.inventory_transactions`
**Tác dụng:** Ghi lại **mọi biến động tồn kho** (nhập hàng, xuất kho khi bán, hoàn kho khi huỷ đơn, điều chỉnh thủ công). Nhờ bảng này có thể tái tính toán lại `stock_quantity` bất kỳ lúc nào và biết chính xác kho thất thoát ở đâu.

**Quan hệ:**
- → `catalog.product_variants` (FK: `product_variant_id`) — variant nào thay đổi
- → `auth.users` (FK: `created_by`) — ai thực hiện thay đổi
- Được ghi **tự động bởi Trigger** `TR_product_variants_stock_log` khi `stock_quantity` thay đổi

***

## Tóm Tắt Mối Quan Hệ Trung Tâm

```
auth.users ←──────────────── là trung tâm của auth
catalog.products ←─────────── là trung tâm của catalog
catalog.product_variants ←─── là thứ khách thực sự mua/giỏ/đơn
orders.bills ←─────────────── là trung tâm của orders
orders.bill_details ←───────── nối variants với bills, là cơ sở cho reviews
```

> **Quy tắc vàng:** Bất cứ khi nào cần truy vết — từ review ngược lên đơn hàng, từ đơn hàng sang thanh toán, từ tồn kho sang ai đã thay đổi — đều có FK để đi ngược chuỗi.