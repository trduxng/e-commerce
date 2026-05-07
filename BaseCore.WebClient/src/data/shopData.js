export const sampleCategories = [
  { id: 1, name: "Electronics", description: "Phones, laptops and smart devices", image: "/img/cat-1.jpg" },
  { id: 2, name: "Fashion", description: "Daily wear and accessories", image: "/img/cat-2.jpg" },
  { id: 3, name: "Home Living", description: "Useful items for your home", image: "/img/cat-3.jpg" },
  { id: 4, name: "Sports", description: "Gear for active days", image: "/img/cat-4.jpg" },
];

export const sampleProducts = [
  {
    id: 1,
    name: "Wireless Studio Headphones",
    price: 2490000,
    oldPrice: 2990000,
    stock: 24,
    rating: 5,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-1.jpg",
    description: "Comfortable over-ear headphones with clear sound, long battery life and quick pairing.",
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 1890000,
    oldPrice: 2190000,
    stock: 38,
    rating: 4.5,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-2.jpg",
    description: "Track workouts, notifications and health metrics with a bright always-on display.",
  },
  {
    id: 3,
    name: "Classic Cotton Shirt",
    price: 420000,
    oldPrice: 520000,
    stock: 62,
    rating: 4,
    categoryId: 2,
    category: sampleCategories[1],
    imageUrl: "/img/product-3.jpg",
    description: "Breathable cotton shirt with a clean regular fit for office and weekend outfits.",
  },
  {
    id: 4,
    name: "Leather Travel Backpack",
    price: 1350000,
    oldPrice: 1590000,
    stock: 19,
    rating: 5,
    categoryId: 2,
    category: sampleCategories[1],
    imageUrl: "/img/product-4.jpg",
    description: "A structured backpack with laptop storage, durable zippers and daily carry capacity.",
  },
  {
    id: 5,
    name: "Ceramic Coffee Set",
    price: 690000,
    oldPrice: 790000,
    stock: 31,
    rating: 4.5,
    categoryId: 3,
    category: sampleCategories[2],
    imageUrl: "/img/product-5.jpg",
    description: "Minimal ceramic cups and saucers for espresso, tea and quiet morning routines.",
  },
  {
    id: 6,
    name: "Compact Desk Lamp",
    price: 560000,
    oldPrice: 650000,
    stock: 47,
    rating: 4,
    categoryId: 3,
    category: sampleCategories[2],
    imageUrl: "/img/product-6.jpg",
    description: "Adjustable LED lamp with warm and cool modes for focused desk work.",
  },
  {
    id: 7,
    name: "Running Training Shoes",
    price: 1680000,
    oldPrice: 1990000,
    stock: 29,
    rating: 5,
    categoryId: 4,
    category: sampleCategories[3],
    imageUrl: "/img/product-7.jpg",
    description: "Lightweight shoes with stable cushioning for gym sessions and road runs.",
  },
  {
    id: 8,
    name: "Yoga Essentials Mat",
    price: 490000,
    oldPrice: 590000,
    stock: 54,
    rating: 4.5,
    categoryId: 4,
    category: sampleCategories[3],
    imageUrl: "/img/product-8.jpg",
    description: "Non-slip mat with balanced cushioning for yoga, stretching and floor workouts.",
  },
  {
    id: 9,
    name: "Portable Bluetooth Speaker",
    price: 890000,
    oldPrice: 1090000,
    stock: 33,
    rating: 4,
    categoryId: 1,
    category: sampleCategories[0],
    imageUrl: "/img/product-9.jpg",
    description: "Water-resistant speaker with punchy bass and a compact body for travel.",
  },
];

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const getProductImage = (product) =>
  product?.imageUrl || product?.image || product?.thumbnailUrl || "/img/product-1.jpg";

export const getProductStock = (product) => {
  if (product?.stock !== null && product?.stock !== undefined && product?.stock !== "") {
    const directStock = Number(product.stock);
    if (Number.isFinite(directStock)) return Math.max(0, directStock);
  }

  const variants = product?.productVariants || product?.variants || [];
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
  return category?.name || "Uncategorized";
};

export const normalizeProductList = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};
