import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { productApi } from "../services/api";
import {
  formatCurrency,
  getProductCategoryName,
  getProductGallery,
  getProductImage,
  getProductOldPrice,
  getProductPrice,
  getProductRating,
  getProductReviewCount,
  getProductStock,
  normalizeProductList,
  sampleProducts,
} from "../data/shopData";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState("1");
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [zoomed, setZoomed] = useState(false);
  const [review, setReview] = useState({ rating: "5", comment: "" });
  const [reviewData, setReviewData] = useState(createEmptyReviewData);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

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
        setActiveImage(defaultVariant?.imageUrl || defaultVariant?.image || getProductImage(loadedProduct));
        setQuantity("1");
        setError("");

        const relatedResponse = await productApi.search({
          categoryId: loadedProduct.categoryId || loadedProduct.category?.id || undefined,
          page: 1,
          pageSize: 5,
        });
        setRelatedProducts(normalizeProductList(relatedResponse.data).filter((item) => Number(item.id) !== Number(id)).slice(0, 4));
      } catch {
        const demoProduct = sampleProducts.find((item) => Number(item.id) === Number(id)) || sampleProducts[0];
        setProduct(demoProduct);
        setRelatedProducts(sampleProducts.filter((item) => Number(item.id) !== Number(demoProduct.id)).slice(0, 4));
        setSelectedVariantId(null);
        setActiveImage(getProductImage(demoProduct));
        setQuantity("1");
        setError("API is not available, so this product is shown from demo data.");
        toast.warning("API is not available, so this product is shown from demo data.", {
          dedupeKey: `product-api-fallback-${id}`,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, toast]);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await productApi.getReviews(id);
        if (active) setReviewData(normalizeReviewData(response.data));
      } catch {
        if (active) setReviewData(createEmptyReviewData());
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before adding products to cart.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const safeQuantity = getSafeQuantity(quantity);
    if (stock !== null && safeQuantity > stock) {
      setQuantity(String(Math.max(1, stock)));
      toast.warning(`Cannot add more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
      return;
    }

    const result = await addToCart(product, safeQuantity, selectedVariant?.id);
    const message = result.message || (result.success ? "Product added to cart." : "Cannot add this product.");
    if (result.success) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before buying this product.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const safeQuantity = getSafeQuantity(quantity);
    const result = await addToCart(product, safeQuantity, selectedVariant?.id);
    if (result.success) {
      toast.success(result.message || "Product added to cart.");
      navigate("/checkout");
      return;
    }

    toast.error(result.message || "Cannot add this product.");
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before writing a review.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await productApi.saveReview(id, {
        rating: Number(review.rating),
        content: review.comment,
      });
      const nextReviewData = normalizeReviewData(response.data);
      setReviewData(nextReviewData);
      setProduct((current) => current ? {
        ...current,
        averageRating: nextReviewData.averageRating,
        reviewCount: nextReviewData.totalCount,
      } : current);
      setReview({ rating: "5", comment: "" });
      toast.success("Your review has been saved.");
    } catch (reviewError) {
      toast.error(reviewError.response?.data?.message || "Cannot save your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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
  const oldPrice = selectedVariant?.salePrice && selectedVariant?.price > selectedVariant?.salePrice
    ? selectedVariant.price
    : getProductOldPrice(product);
  const productImage = activeImage || selectedVariant?.imageUrl || selectedVariant?.image || getProductImage(product);
  const galleryImages = getProductGallery(product);
  const rating = reviewsLoading ? getProductRating(product) : reviewData.averageRating;
  const reviewCount = reviewsLoading ? getProductReviewCount(product) : reviewData.totalCount;
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
    setActiveImage(nextVariant?.imageUrl || nextVariant?.image || getProductImage(product));
    setQuantity("1");
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
            <div className="product-detail-media bg-light">
              <button className="product-detail-zoom-trigger" type="button" onClick={() => setZoomed(true)} aria-label="Zoom product image">
                <img className="product-detail-main-image" src={productImage} alt={product.name} />
                <span><i className="fa fa-magnifying-glass-plus"></i> Zoom</span>
              </button>
            </div>
            {galleryImages.length > 1 && (
              <div className="product-detail-thumbs">
                {galleryImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={`product-detail-thumb ${productImage === image ? "is-active" : ""}`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={product.name} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-7 h-auto mb-30">
            <div className="product-detail-panel h-100 bg-light p-30">
              {error && <div className="alert alert-info">{error}</div>}
              <h3>{product.name}</h3>
              <div className="d-flex mb-3">
                <div className="text-primary me-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <small
                      key={index}
                      className={`fa ${index < Math.floor(rating) ? "fa-star" : index < rating ? "fa-star-half-alt" : "far fa-star"} me-1`}
                    ></small>
                  ))}
                </div>
                <small className="pt-1">({reviewCount} reviews)</small>
              </div>
              <div className="product-detail-price mb-4">
                <h3>{formatCurrency(selectedPrice)}</h3>
                {oldPrice && <del>{formatCurrency(oldPrice)}</del>}
              </div>
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
                  <strong className="text-dark me-3 mb-2">Size:</strong>
                  {sizeOptions.map((size) => {
                    const disabled = !optionHasStock("size", size);
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`btn btn-sm me-2 mb-2 ${selectedSize === size ? "btn-primary" : "btn-outline-dark"}`}
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
                  <strong className="text-dark me-3 mb-2">Color:</strong>
                  {colorOptions.map((color) => {
                    const disabled = !optionHasStock("color", color);
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`btn btn-sm me-2 mb-2 ${selectedColor === color ? "btn-primary" : "btn-outline-dark"}`}
                        disabled={disabled}
                        onClick={() => selectVariant("color", color)}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="d-flex align-items-center flex-wrap mb-4 pt-2">
                <div className="input-group quantity me-3 mb-2" style={{ width: "150px", flex: "0 0 150px" }}>
                  <div>
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
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-plus"
                      disabled={!canIncreaseQuantity}
                      onClick={() => {
                        if (!canIncreaseQuantity) {
                          toast.warning(`Cannot add more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
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
                  <i className="fa fa-shopping-cart me-1"></i> Add To Cart
                </button>
                <button type="button" className="btn btn-outline-primary px-3 ms-2 mb-2" disabled={!canAddToCart} onClick={handleBuyNow}>
                  <i className="fa fa-bolt me-1"></i> Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container-fluid pb-5">
        <div className="row px-xl-5">
          <div className="col-12">
            <div className="product-tabs">
              <div className="product-tab-list" role="tablist">
                {["description", "specifications", "reviews"].map((tab) => (
                  <button key={tab} className={activeTab === tab ? "is-active" : ""} type="button" role="tab" onClick={() => setActiveTab(tab)}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="product-tab-content">
                {activeTab === "description" && (
                  <div>
                    <h4>Product Description</h4>
                    <p>{product.shortDescription || product.description || "A quality product ready for everyday use."}</p>
                    <p>{product.description || "Designed for a practical shopping experience with reliable fulfillment."}</p>
                  </div>
                )}
                {activeTab === "specifications" && (
                  <div>
                    <h4>Specifications</h4>
                    <table className="table product-spec-table"><tbody>
                      {[
                        ["Brand", product.brand || "BaseShop"],
                        ["Model", selectedVariant?.sku || product.slug || `Product-${product.id}`],
                        ["Weight", selectedVariant?.weightGram ? `${selectedVariant.weightGram} g` : "Not specified"],
                        ["Color", selectedVariant?.color || "Varies by option"],
                        ["Material", product.material || "Not specified"],
                        ["Warranty", product.warranty || "Contact support"],
                      ].map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}
                    </tbody></table>
                  </div>
                )}
                {activeTab === "reviews" && (
                  <div className="row">
                    <div className="col-lg-5">
                      <div className="review-summary"><strong>{rating.toFixed(1)}</strong><span>out of 5</span><p>{reviewCount} customer reviews</p></div>
                      <div className="review-breakdown">
                        {reviewData.breakdown.map(({ stars, percentage }) => (
                          <div key={stars}><span>{stars} star</span><i><b style={{ "--review-width": `${percentage}%` }}></b></i><em>{percentage}%</em></div>
                        ))}
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <form className="review-form" onSubmit={submitReview}>
                        <h4>Write a Review</h4>
                        <select className="form-select" value={review.rating} onChange={(event) => setReview((current) => ({ ...current, rating: event.target.value }))}>
                          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                        </select>
                        <textarea className="form-control" rows="4" placeholder="Share your experience" value={review.comment} onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))} required />
                        <button className="btn btn-primary" disabled={submittingReview}>{submittingReview ? "Saving..." : "Submit review"}</button>
                      </form>
                    </div>
                    <div className="col-12 mt-4">
                      <div className="review-list">
                        <h4>Customer Reviews</h4>
                        {reviewsLoading && <p>Loading reviews...</p>}
                        {!reviewsLoading && reviewData.items.length === 0 && <p className="review-empty">No reviews yet. Be the first to review this product.</p>}
                        {!reviewsLoading && reviewData.items.map((item) => (
                          <article className="review-item" key={item.id}>
                            <div className="review-item-header">
                              <strong>{item.reviewerName}</strong>
                              {item.isVerifiedPurchase && <span className="review-verified">Verified purchase</span>}
                              <time dateTime={item.createdAt}>{formatReviewDate(item.createdAt)}</time>
                            </div>
                            <div className="text-primary" aria-label={`${item.rating} out of 5 stars`}>
                              {Array.from({ length: 5 }).map((_, index) => (
                                <small key={index} className={`fa ${index < item.rating ? "fa-star" : "far fa-star"} me-1`}></small>
                              ))}
                            </div>
                            {item.title && <h5>{item.title}</h5>}
                            <p>{item.content}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <div className="container-fluid py-5">
          <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
            <span className="bg-secondary pe-3">Related Products</span>
          </h2>
          <div className="row px-xl-5 related-products-carousel">
            {relatedProducts.map((item) => (
              <div key={item.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}
      {zoomed && (
        <button className="product-zoom-overlay" type="button" onClick={() => setZoomed(false)} aria-label="Close zoomed image">
          <img src={productImage} alt={product.name} />
          <span><i className="fa fa-xmark"></i></span>
        </button>
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
  if (!variant) return getProductPrice(product);
  return variant.salePrice ?? variant.price ?? getProductPrice(product);
};

const getSafeQuantity = (value) => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
};

const createEmptyReviewData = () => ({
  averageRating: 0,
  totalCount: 0,
  breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 })),
  items: [],
});

const normalizeReviewData = (data) => ({
  averageRating: Number.isFinite(Number(data?.averageRating)) ? Math.min(5, Math.max(0, Number(data.averageRating))) : 0,
  totalCount: Number.isFinite(Number(data?.totalCount)) ? Math.max(0, Math.floor(Number(data.totalCount))) : 0,
  breakdown: [5, 4, 3, 2, 1].map((stars) => {
    const item = Array.isArray(data?.breakdown) ? data.breakdown.find((entry) => Number(entry.stars) === stars) : null;
    return {
      stars,
      count: Number.isFinite(Number(item?.count)) ? Math.max(0, Math.floor(Number(item.count))) : 0,
      percentage: Number.isFinite(Number(item?.percentage)) ? Math.min(100, Math.max(0, Math.round(Number(item.percentage)))) : 0,
    };
  }),
  items: Array.isArray(data?.items) ? data.items : [],
});

const formatReviewDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
};

export default ProductDetail;
