export const sampleCategories = [
  { id: 1, name: "Điện tử", description: "Điện thoại, máy tính xách tay và thiết bị thông minh", image: "/img/cat-1.jpg" },
  { id: 2, name: "Thời trang", description: "Trang phục và phụ kiện hằng ngày", image: "/img/cat-2.jpg" },
  { id: 3, name: "Nhà cửa và đời sống", description: "Sản phẩm tiện ích cho ngôi nhà của bạn", image: "/img/cat-3.jpg" },
  { id: 4, name: "Thể thao", description: "Trang thiết bị cho phong cách sống năng động", image: "/img/cat-4.jpg" },
];

export const sampleProducts = [
  {
    id: 1,
    name: "Tai nghe không dây Studio",
    price: 2490000,
    oldPrice: 2990000,
    stock: 24,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-1.jpg",
    description: "Tai nghe chụp tai êm ái, âm thanh rõ nét, thời lượng pin dài và kết nối nhanh chóng.",
  },
  {
    id: 2,
    name: "Đồng hồ thể thao thông minh",
    price: 1890000,
    oldPrice: 2190000,
    stock: 38,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-2.jpg",
    description: "Theo dõi luyện tập, thông báo và chỉ số sức khỏe trên màn hình sáng rõ luôn hiển thị.",
  },
  {
    id: 3,
    name: "Áo sơ mi cotton cổ điển",
    price: 420000,
    oldPrice: 520000,
    stock: 62,
    categoryId: 2,
    category: sampleCategories[1],
    imageUrl: "/img/product-3.jpg",
    description: "Áo sơ mi cotton thoáng mát, phom dáng thanh lịch phù hợp đi làm và dạo phố cuối tuần.",
  },
  {
    id: 4,
    name: "Ba lô du lịch da",
    price: 1350000,
    oldPrice: 1590000,
    stock: 19,
    categoryId: 2,
    category: sampleCategories[1],
    imageUrl: "/img/product-4.jpg",
    description: "Ba lô chắc chắn với ngăn đựng laptop, khóa kéo bền bỉ và sức chứa phù hợp sử dụng hằng ngày.",
  },
  {
    id: 5,
    name: "Bộ tách cà phê gốm sứ",
    price: 690000,
    oldPrice: 790000,
    stock: 31,
    categoryId: 3,
    category: sampleCategories[2],
    imageUrl: "/img/product-5.jpg",
    description: "Bộ tách và đĩa gốm sứ tối giản dành cho cà phê espresso, trà và những buổi sáng thư thái.",
  },
  {
    id: 6,
    name: "Đèn bàn nhỏ gọn",
    price: 560000,
    oldPrice: 650000,
    stock: 47,
    categoryId: 3,
    category: sampleCategories[2],
    imageUrl: "/img/product-6.jpg",
    description: "Đèn LED điều chỉnh linh hoạt với ánh sáng ấm và lạnh, hỗ trợ làm việc tập trung.",
  },
  {
    id: 7,
    name: "Giày chạy bộ luyện tập",
    price: 1680000,
    oldPrice: 1990000,
    stock: 29,
    categoryId: 4,
    category: sampleCategories[3],
    imageUrl: "/img/product-7.jpg",
    description: "Giày nhẹ với lớp đệm ổn định, phù hợp tập gym và chạy bộ đường dài.",
  },
  {
    id: 8,
    name: "Thảm tập yoga thiết yếu",
    price: 490000,
    oldPrice: 590000,
    stock: 54,
    categoryId: 4,
    category: sampleCategories[3],
    imageUrl: "/img/product-8.jpg",
    description: "Thảm chống trượt với độ êm cân bằng cho yoga, giãn cơ và các bài tập trên sàn.",
  },
  {
    id: 9,
    name: "Loa Bluetooth di động",
    price: 890000,
    oldPrice: 1090000,
    stock: 33,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-9.jpg",
    description: "Loa chống nước với âm trầm mạnh mẽ và thiết kế nhỏ gọn, thuận tiện mang theo khi du lịch.",
  },
];

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const getProductVariants = (product) => {
  const variants = product?.productVariants || product?.variants || [];
  return Array.isArray(variants) ? variants.filter((variant) => variant?.isActive !== false) : [];
};

export const getProductPrice = (product) => {
  const directPrice = Number(product?.price ?? product?.salePrice ?? product?.basePrice);
  if (Number.isFinite(directPrice) && directPrice > 0) return directPrice;

  const variantPrices = getProductVariants(product)
    .map((variant) => Number(variant?.salePrice ?? variant?.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  return variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
};

export const getProductOldPrice = (product) => {
  const explicitOldPrice = Number(product?.oldPrice ?? product?.regularPrice);
  if (Number.isFinite(explicitOldPrice) && explicitOldPrice > getProductPrice(product)) {
    return explicitOldPrice;
  }

  const variant = getProductVariants(product).find((item) => {
    const salePrice = Number(item?.salePrice);
    const price = Number(item?.price);
    return Number.isFinite(salePrice) && Number.isFinite(price) && salePrice > 0 && price > salePrice;
  });

  return variant ? Number(variant.price) : null;
};

export const getProductImage = (product) => {
  const variantImage = getProductVariants(product)
    .map((variant) => variant?.imageUrl || variant?.image)
    .find(Boolean);

  return product?.imageUrl || product?.image || product?.thumbnailUrl || variantImage || "/img/product-1.jpg";
};

export const getProductStock = (product) => {
  if (product?.stock !== null && product?.stock !== undefined && product?.stock !== "") {
    const directStock = Number(product.stock);
    if (Number.isFinite(directStock)) return Math.max(0, directStock);
  }

  const variants = getProductVariants(product);
  if (Array.isArray(variants) && variants.length > 0) {
    return variants.reduce((sum, variant) => {
      const stock = Number(variant?.stockQuantity ?? variant?.stock);
      return sum + (Number.isFinite(stock) ? Math.max(0, stock) : 0);
    }, 0);
  }

  return null;
};

export const getProductCategoryName = (product, categories = sampleCategories) => {
  if (product?.category?.name) return product.category.name;
  const category = categories.find((item) => Number(item.id) === Number(product?.categoryId));
  return category?.name || "Chưa phân loại";
};

export const normalizeProductList = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

export const normalizeCategoryList = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

export const getProductGallery = (product) => {
  const images = [
    getProductImage(product),
    ...getProductVariants(product).map((variant) => variant?.imageUrl || variant?.image).filter(Boolean),
  ];

  const seen = new Set();
  return images
    .map((image) => String(image || "").trim())
    .filter((image) => {
      if (!image) return false;
      const key = image.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const getProductRating = (product) => {
  const rating = Number(product?.averageRating ?? product?.rating);
  if (Number.isFinite(rating) && rating > 0) return Math.min(5, rating);
  return 0;
};

export const getProductReviewCount = (product) => {
  const reviewCount = Number(product?.reviewCount);
  if (Number.isFinite(reviewCount) && reviewCount > 0) return Math.floor(reviewCount);
  return 0;
};

const apiMessageTranslations = {
  "username and password are required": "Vui lòng nhập tên đăng nhập và mật khẩu.",
  "invalid username or password": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "invalid request": "Yêu cầu không hợp lệ.",
  "password must be at least 6 characters": "Mật khẩu phải có ít nhất 6 ký tự.",
  "registration successful": "Đăng ký tài khoản thành công.",
  "quantity must be greater than zero": "Số lượng phải lớn hơn 0.",
  "quantity must be at least 1.": "Số lượng phải từ 1 trở lên.",
  "product not found": "Không tìm thấy sản phẩm.",
  "product not found or unavailable": "Sản phẩm không tồn tại hoặc hiện không khả dụng.",
  "this product is out of stock.": "Sản phẩm này đã hết hàng.",
  "product added to cart.": "Đã thêm sản phẩm vào giỏ hàng.",
  "cart item not found": "Không tìm thấy sản phẩm trong giỏ hàng.",
  "your cart is empty.": "Giỏ hàng của bạn đang trống.",
  "please select at least one product to checkout.": "Vui lòng chọn ít nhất một sản phẩm để thanh toán.",
  "one or more selected cart items were not found.": "Không tìm thấy một hoặc nhiều sản phẩm đã chọn trong giỏ hàng.",
  "one or more cart products are no longer available.": "Một hoặc nhiều sản phẩm trong giỏ hàng hiện không còn khả dụng.",
  "receiver name is required": "Vui lòng nhập tên người nhận.",
  "receiver name is required.": "Vui lòng nhập tên người nhận.",
  "receiver phone is required": "Vui lòng nhập số điện thoại người nhận.",
  "receiver phone is required.": "Vui lòng nhập số điện thoại người nhận.",
  "shipping address is required": "Vui lòng nhập địa chỉ giao hàng.",
  "shipping address is required.": "Vui lòng nhập địa chỉ giao hàng.",
  "payment method is not supported.": "Phương thức thanh toán này chưa được hỗ trợ.",
  "address not found": "Không tìm thấy địa chỉ.",
  "phone is required": "Vui lòng nhập số điện thoại.",
  "province is required": "Vui lòng nhập tỉnh/thành phố.",
  "district is required": "Vui lòng nhập quận/huyện.",
  "ward is required": "Vui lòng nhập phường/xã.",
  "address detail is required": "Vui lòng nhập địa chỉ chi tiết.",
  "account not found": "Không tìm thấy tài khoản.",
  "full name is required.": "Vui lòng nhập họ và tên.",
  "email is required.": "Vui lòng nhập địa chỉ email.",
  "email is already in use.": "Địa chỉ email này đã được sử dụng.",
  "product is already in favorites": "Sản phẩm đã có trong danh sách yêu thích.",
  "product added to favorites": "Đã thêm sản phẩm vào danh sách yêu thích.",
  "product removed from favorites": "Đã xóa sản phẩm khỏi danh sách yêu thích.",
  "coupon code is required": "Vui lòng nhập mã giảm giá.",
  "invalid or expired coupon code": "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
  "coupon usage limit reached": "Mã giảm giá đã hết lượt sử dụng.",
  "order not found": "Không tìm thấy đơn hàng.",
  "order must contain at least one item": "Đơn hàng phải có ít nhất một sản phẩm.",
  "cannot cancel completed order": "Không thể hủy đơn hàng đã hoàn tất.",
  "order already cancelled": "Đơn hàng đã được hủy trước đó.",
  "order cancelled successfully": "Đã hủy đơn hàng thành công.",
  "only delivered orders can be returned": "Chỉ có thể trả hàng đối với đơn đã giao.",
  "rating must be between 1 and 5.": "Số sao đánh giá phải từ 1 đến 5.",
  "review content is required.": "Vui lòng nhập nội dung đánh giá.",
  "review content cannot exceed 2000 characters.": "Nội dung đánh giá không được vượt quá 2000 ký tự.",
  "review title cannot exceed 150 characters.": "Tiêu đề đánh giá không được vượt quá 150 ký tự.",
  "please review this product from a delivered order.": "Vui lòng đánh giá sản phẩm từ một đơn hàng đã giao.",
  "only customers who bought and received this product can write a review.": "Chỉ khách hàng đã mua và nhận sản phẩm mới có thể viết đánh giá.",
};

const apiMessagePatterns = [
  {
    pattern: /^cannot add more than (\d+) items? in stock\.?$/i,
    translate: ([, stock]) => `Không thể thêm quá ${stock} sản phẩm hiện có trong kho.`,
  },
  {
    pattern: /^insufficient stock for (.+)$/i,
    translate: ([, productName]) => `Sản phẩm ${productName} không đủ số lượng tồn kho.`,
  },
  {
    pattern: /^product (.+) not found$/i,
    translate: ([, productName]) => `Không tìm thấy sản phẩm ${productName}.`,
  },
  {
    pattern: /^product (.+) has no active variant for the selected option$/i,
    translate: ([, productName]) => `Sản phẩm ${productName} không có phân loại phù hợp đang được bán.`,
  },
  {
    pattern: /^minimum order value of (.+) required$/i,
    translate: ([, minimumValue]) => `Đơn hàng phải có giá trị tối thiểu ${formatCurrency(minimumValue)} để sử dụng mã giảm giá.`,
  },
  {
    pattern: /^registration failed:/i,
    translate: () => "Đăng ký không thành công. Vui lòng kiểm tra thông tin và thử lại.",
  },
];

const vietnameseCharacters = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ-ỹ]/i;

export const localizeApiMessage = (
  message,
  fallback = "Không thể hoàn tất yêu cầu. Vui lòng thử lại."
) => {
  const value = typeof message === "string" ? message.trim() : "";
  if (!value) return fallback;

  const translated = apiMessageTranslations[value.toLowerCase()];
  if (translated) return translated;

  for (const item of apiMessagePatterns) {
    const match = value.match(item.pattern);
    if (match) return item.translate(match);
  }

  return vietnameseCharacters.test(value) ? value : fallback;
};

export const getApiErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  const message = typeof responseData === "string"
    ? responseData
    : responseData?.message || responseData?.Message;

  return localizeApiMessage(message, fallback);
};
