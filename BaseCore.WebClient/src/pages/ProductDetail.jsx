import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { productApi } from "../services/api";
import {
  formatCurrency,
  getProductCategoryName,
  getProductImage,
  getProductStock,
  normalizeProductList,
} from "../data/shopData";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState("1");
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await productApi.getById(id);
        const loadedProduct = response.data;
        const variants = getActiveVariants(loadedProduct);
        const defaultVariant = variants.find((variant) => getVariantStock(variant) > 0) || variants[0] || null;
        setProduct(loadedProduct);
        setSelectedVariantId(defaultVariant?.id ?? null);
        setQuantity("1");
        setError("");

        const relatedResponse = await productApi.search({
          categoryId: loadedProduct.categoryId || loadedProduct.category?.id || undefined,
          page: 1,
          pageSize: 5,
        });
        setRelatedProducts(normalizeProductList(relatedResponse.data).filter((item) => Number(item.id) !== Number(id)).slice(0, 4));
      } catch {
        setProduct(null);
        setRelatedProducts([]);
        setError("Cannot load this product from database. Please start ApiGateway and APIService.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const safeQuantity = getSafeQuantity(quantity);
    if (stock !== null && safeQuantity > stock) {
      setQuantity(String(Math.max(1, stock)));
      setCartMessage(`Cannot add more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
      return;
    }

    const result = await addToCart(product, safeQuantity, selectedVariant?.id);
    setCartMessage(result.message || (result.success ? "Product added to cart." : "Cannot add this product."));
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-warning mx-xl-5">{error || "Product not found."}</div>
        <div className="mx-xl-5">
          <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const variants = getActiveVariants(product);
  const selectedVariant = variants.find((variant) => Number(variant.id) === Number(selectedVariantId)) || variants[0] || null;
  const sizeOptions = getUniqueVariantValues(variants, "size");
  const colorOptions = getUniqueVariantValues(variants, "color");
  const selectedSize = normalizeVariantValue(selectedVariant?.size);
  const selectedColor = normalizeVariantValue(selectedVariant?.color);
  const stock = selectedVariant ? getVariantStock(selectedVariant) : getProductStock(product);
  const selectedPrice = getVariantPrice(selectedVariant, product);
  const productImage = selectedVariant?.imageUrl || selectedVariant?.image || getProductImage(product);
  const safeQuantity = getSafeQuantity(quantity);
  const isOutOfStock = stock !== null && stock <= 0;
  const canIncreaseQuantity = stock === null || safeQuantity < stock;
  const canAddToCart = !isOutOfStock && (variants.length === 0 || Boolean(selectedVariant));

  const selectVariant = (field, value) => {
    const nextVariant =
      variants.find((variant) => {
        const matchesField = normalizeVariantValue(variant?.[field]) === value;
        const matchesSize = field === "size" || !selectedSize || normalizeVariantValue(variant?.size) === selectedSize;
        const matchesColor = field === "color" || !selectedColor || normalizeVariantValue(variant?.color) === selectedColor;
        return matchesField && matchesSize && matchesColor && getVariantStock(variant) > 0;
      }) ||
      variants.find((variant) => normalizeVariantValue(variant?.[field]) === value) ||
      null;

    setSelectedVariantId(nextVariant?.id ?? null);
    setQuantity("1");
    setCartMessage("");
  };

  const optionHasStock = (field, value) =>
    variants.some((variant) => {
      const matchesField = normalizeVariantValue(variant?.[field]) === value;
      const matchesSize = field === "size" || !selectedSize || normalizeVariantValue(variant?.size) === selectedSize;
      const matchesColor = field === "color" || !selectedColor || normalizeVariantValue(variant?.color) === selectedColor;
      return matchesField && matchesSize && matchesColor && getVariantStock(variant) > 0;
    });

  const setQuantitySafely = (nextValue) => {
    const nextQuantity = getSafeQuantity(nextValue);
    const cappedQuantity = stock === null ? nextQuantity : Math.min(nextQuantity, Math.max(1, stock));
    setQuantity(String(cappedQuantity));
  };

  const handleQuantityInput = (event) => {
    const nextValue = event.target.value;
    if (/^\d*$/.test(nextValue)) {
      setQuantity(nextValue);
      setCartMessage("");
    }
  };

  const handleQuantityBlur = () => {
    setQuantitySafely(quantity);
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Shop</Link>
              <span className="breadcrumb-item active">{product.name}</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid pb-5">
        <div className="row px-xl-5">
          <div className="col-lg-5 mb-30">
            <div className="bg-light">
              <img className="w-100 img-fluid" src={productImage} alt={product.name} />
            </div>
          </div>

          <div className="col-lg-7 h-auto mb-30">
            <div className="h-100 bg-light p-30">
              <h3>{product.name}</h3>
              <div className="d-flex mb-3">
                <div className="text-primary mr-2">
                  <small className="fas fa-star"></small>
                  <small className="fas fa-star"></small>
                  <small className="fas fa-star"></small>
                  <small className="fas fa-star-half-alt"></small>
                  <small className="far fa-star"></small>
                </div>
                <small className="pt-1">({product.reviewCount || 24} reviews)</small>
              </div>
              <h3 className="font-weight-semi-bold mb-4">{formatCurrency(selectedPrice)}</h3>
              <p className="mb-4">{product.description || "A quality product ready for everyday use."}</p>
              <p className="mb-2">
                <strong>Category:</strong> {getProductCategoryName(product, [])}
              </p>
              <p className="mb-4">
                <strong>Stock:</strong> {stock ?? "Available"}
              </p>
              {selectedVariant?.sku && (
                <p className="mb-3">
                  <strong>SKU:</strong> {selectedVariant.sku}
                </p>
              )}
              {sizeOptions.length > 0 && (
                <div className="d-flex align-items-center flex-wrap mb-3">
                  <strong className="text-dark mr-3 mb-2">Size:</strong>
                  {sizeOptions.map((size) => {
                    const disabled = !optionHasStock("size", size);
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`btn btn-sm mr-2 mb-2 ${selectedSize === size ? "btn-primary" : "btn-outline-dark"}`}
                        disabled={disabled}
                        onClick={() => selectVariant("size", size)}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              )}
              {colorOptions.length > 0 && (
                <div className="d-flex align-items-center flex-wrap mb-4">
                  <strong className="text-dark mr-3 mb-2">Color:</strong>
                  {colorOptions.map((color) => {
                    const disabled = !optionHasStock("color", color);
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`btn btn-sm mr-2 mb-2 ${selectedColor === color ? "btn-primary" : "btn-outline-dark"}`}
                        disabled={disabled}
                        onClick={() => selectVariant("color", color)}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              )}
              {cartMessage && (
                <div className={`alert ${cartMessage.includes("Cannot") || cartMessage.includes("out of stock") ? "alert-warning" : "alert-success"}`}>
                  {cartMessage}
                </div>
              )}

              <div className="d-flex align-items-center flex-wrap mb-4 pt-2">
                <div className="input-group quantity mr-3 mb-2" style={{ width: "150px", flex: "0 0 150px" }}>
                  <div className="input-group-prepend">
                    <button
                      type="button"
                      className="btn btn-primary btn-minus"
                      onClick={() => setQuantitySafely(safeQuantity - 1)}
                    >
                      <i className="fa fa-minus"></i>
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-control bg-white text-center text-dark"
                    value={quantity}
                    onChange={handleQuantityInput}
                    onBlur={handleQuantityBlur}
                    aria-label="Quantity"
                  />
                  <div className="input-group-append">
                    <button
                      type="button"
                      className="btn btn-primary btn-plus"
                      disabled={!canIncreaseQuantity}
                      onClick={() => {
                        if (!canIncreaseQuantity) {
                          setCartMessage(`Cannot add more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
                          return;
                        }
                        setQuantitySafely(safeQuantity + 1);
                      }}
                    >
                      <i className="fa fa-plus"></i>
                    </button>
                  </div>
                </div>
                <button type="button" className="btn btn-primary px-3" disabled={!canAddToCart} onClick={handleAddToCart}>
                  <i className="fa fa-shopping-cart mr-1"></i> Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="container-fluid py-5">
          <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
            <span className="bg-secondary pr-3">Related Products</span>
          </h2>
          <div className="row px-xl-5">
            {relatedProducts.map((item) => (
              <div key={item.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const getActiveVariants = (product) => {
  const variants = product?.productVariants || product?.variants || [];
  return Array.isArray(variants) ? variants.filter((variant) => variant?.isActive !== false) : [];
};

const normalizeVariantValue = (value) => String(value || "").trim();

const getUniqueVariantValues = (variants, field) =>
  Array.from(new Set(variants.map((variant) => normalizeVariantValue(variant?.[field])).filter(Boolean)));

const getVariantStock = (variant) => {
  const stock = Number(variant?.stockQuantity ?? variant?.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
};

const getVariantPrice = (variant, product) => {
  if (!variant) return product?.price ?? product?.basePrice ?? 0;
  return variant.salePrice ?? variant.price ?? product?.price ?? product?.basePrice ?? 0;
};

const getSafeQuantity = (value) => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
};

export default ProductDetail;
