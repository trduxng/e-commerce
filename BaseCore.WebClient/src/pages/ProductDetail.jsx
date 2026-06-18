import React, { useEffect, useState, useMemo } from "react";
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
  const [reviewData, setReviewData] = useState(createEmptyReviewData());
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

  const variants = useMemo(() => getActiveVariants(product), [product]);
  const selectedVariant = useMemo(() => variants.find((v) => v.id === selectedVariantId) || null, [variants, selectedVariantId]);
  const galleryImages = useMemo(() => getProductGallery(product), [product]);
  
  const sizeOptions = useMemo(() => getUniqueVariantValues(variants, "size"), [variants]);
  const colorOptions = useMemo(() => getUniqueVariantValues(variants, "color"), [variants]);

  const selectedSize = selectedVariant?.size || null;
  const selectedColor = selectedVariant?.color || null;

  const stock = getVariantStock(selectedVariant) ?? getProductStock(product);
  const selectedPrice = getVariantPrice(selectedVariant, product);
  const oldPrice = getProductOldPrice(product);
  const rating = product?.averageRating || getProductRating(product);
  const reviewCount = product?.reviewCount || getProductReviewCount(product);
  const safeQuantity = getSafeQuantity(quantity);
  const canIncreaseQuantity = stock === null || safeQuantity < stock;
  const canAddToCart = stock === null || stock > 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before adding products to cart.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const safeQty = getSafeQuantity(quantity);
    if (stock !== null && safeQty > stock) {
      setQuantity(String(Math.max(1, stock)));
      toast.warning(`Cannot add more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
      return;
    }

    const result = await addToCart(product, safeQty, selectedVariant?.id);
    if (result.success) {
      toast.success(result.message || "Product added to cart.");
    } else {
      toast.error(result.message || "Cannot add this product.");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before buying this product.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const safeQty = getSafeQuantity(quantity);
    if (stock !== null && safeQty > stock) {
      setQuantity(String(Math.max(1, stock)));
      toast.warning(`Cannot buy more than ${stock} item${stock === 1 ? "" : "s"} in stock.`);
      return;
    }

    navigate("/checkout", {
      state: {
        buyNowItem: {
          id: product.id,
          productId: product.id,
          productVariantId: selectedVariant?.id ?? null,
          name: product.name,
          price: selectedPrice,
          imageUrl: selectedVariant?.imageUrl || selectedVariant?.image || getProductImage(product),
          size: selectedVariant?.size || null,
          color: selectedVariant?.color || null,
          stock,
          quantity: safeQty,
        },
      },
    });
  };

  const setQuantitySafely = (value) => {
    const nextValue = Math.max(1, value);
    if (stock !== null && nextValue > stock) {
      setQuantity(String(stock));
    } else {
      setQuantity(String(nextValue));
    }
  };

  const handleQuantityInput = (event) => {
    const value = event.target.value.replace(/[^0-9]/g, "");
    setQuantity(value);
  };

  const handleQuantityBlur = () => {
    setQuantitySafely(getSafeQuantity(quantity));
  };

  const selectExactVariant = (variant) => {
    setSelectedVariantId(variant.id);
    setActiveImage(variant.imageUrl || variant.image || getProductImage(product));
    setQuantity("1");
  };

  const selectGalleryImage = (image) => {
    setActiveImage(image);

    const matchedVariant = variants.find(
      (variant) => normalizeImageUrl(variant.imageUrl || variant.image) === normalizeImageUrl(image)
    );
    if (matchedVariant) {
      setSelectedVariantId(matchedVariant.id);
      setQuantity("1");
    }
  };

  const selectVariant = (field, value) => {
    const nextCriteria = {
      size: field === "size" ? value : selectedSize,
      color: field === "color" ? value : selectedColor,
    };

    const match = variants.find((v) => normalizeVariantValue(v.size) === normalizeVariantValue(nextCriteria.size) && normalizeVariantValue(v.color) === normalizeVariantValue(nextCriteria.color)) ||
                  variants.find((v) => normalizeVariantValue(v[field]) === normalizeVariantValue(value)) ||
                  variants[0];

    if (match) {
      setSelectedVariantId(match.id);
      if (match.imageUrl || match.image) {
        setActiveImage(match.imageUrl || match.image);
      }
    }
  };

  const optionHasStock = (field, value) => {
    const otherField = field === "size" ? "color" : "size";
    const otherValue = field === "size" ? selectedColor : selectedSize;

    return variants.some((v) => normalizeVariantValue(v[field]) === normalizeVariantValue(value) && 
                               (otherValue === null || normalizeVariantValue(v[otherField]) === normalizeVariantValue(otherValue)) && 
                               getVariantStock(v) > 0);
  };

  if (loading) {
    return <div className="container-fluid py-5 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (!product) {
    return <div className="container-fluid py-5"><div className="alert alert-warning mx-xl-5">Product not found.</div></div>;
  }

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
              <img className="product-detail-main-image" src={activeImage || getProductImage(product)} alt={product.name} />
            </div>
            {galleryImages.length > 1 && (
              <div className="product-detail-thumbs">
                {galleryImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={`product-detail-thumb ${normalizeImageUrl(activeImage) === normalizeImageUrl(image) ? "is-active" : ""}`}
                    onClick={() => selectGalleryImage(image)}
                    aria-label={`View ${product.name}`}
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
                    <small key={index} className={`fa ${index < Math.floor(rating) ? "fa-star" : index < rating ? "fa-star-half-alt" : "far fa-star"} me-1`}></small>
                  ))}
                </div>
                <small className="pt-1">({reviewCount} reviews)</small>
              </div>
              <div className="product-detail-price mb-4">
                <h3>{formatCurrency(selectedPrice)}</h3>
                {oldPrice && <del>{formatCurrency(oldPrice)}</del>}
              </div>
              <p className="mb-4">{product.description || "A quality product ready for everyday use."}</p>
              <p className="mb-2"><strong>Category:</strong> {getProductCategoryName(product, [])}</p>
              <p className="mb-4"><strong>Stock:</strong> {stock ?? "Available"}</p>

              {variants.length > 0 && (
                <div className="mb-4">
                  <strong className="d-block mb-2">Variant</strong>
                  <div className="d-flex flex-wrap" style={{ gap: 10 }}>
                    {variants.map((variant, index) => {
                      const variantStock = getVariantStock(variant);
                      const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku || `Variant ${index + 1}`;
                      const isSelected = selectedVariant?.id === variant.id;

                      return (
                        <button
                          key={variant.id ?? `${variant.sku}-${index}`}
                          type="button"
                          className={`btn d-flex align-items-center text-left ${isSelected ? "btn-primary" : "btn-outline-secondary"}`}
                          disabled={variantStock === 0}
                          onClick={() => selectExactVariant(variant)}
                          style={{ minWidth: 150 }}
                        >
                          <span className="d-flex flex-column align-items-start">
                            <span>{variantLabel}</span>
                            <small>{variantStock > 0 ? `${variantStock} in stock` : "Out of stock"}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
               
              <div className="d-flex align-items-center flex-wrap mb-4 pt-2">
                <div className="input-group quantity me-3 mb-2" style={{ width: "150px", flex: "0 0 150px" }}>
                  <button type="button" className="btn btn-primary btn-minus" onClick={() => setQuantitySafely(safeQuantity - 1)}><i className="fa fa-minus"></i></button>
                  <input type="text" className="form-control bg-white text-center text-dark" value={quantity} onChange={handleQuantityInput} onBlur={handleQuantityBlur} />
                  <button type="button" className="btn btn-primary btn-plus" disabled={!canIncreaseQuantity} onClick={() => setQuantitySafely(safeQuantity + 1)}><i className="fa fa-plus"></i></button>
                </div>
                <button type="button" className="btn btn-primary px-3" disabled={!canAddToCart} onClick={handleAddToCart}><i className="fa fa-shopping-cart me-1"></i> Add To Cart</button>
                <button type="button" className="btn btn-outline-primary px-3 ms-2 mb-2" disabled={!canAddToCart} onClick={handleBuyNow}><i className="fa fa-bolt me-1"></i> Buy Now</button>
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
                  <button key={tab} className={activeTab === tab ? "is-active" : ""} type="button" role="tab" onClick={() => setActiveTab(tab)}>{tab}</button>
                ))}
              </div>
              <div className="product-tab-content">
                {activeTab === "description" && (
                  <div>
                    <h4>Product Description</h4>
                    <p>{product.shortDescription || product.description || "A quality product ready for everyday use."}</p>
                  </div>
                )}
                {activeTab === "specifications" && (
                  <div>
                    <h4>Specifications</h4>
                    <table className="table product-spec-table"><tbody>
                      {[
                        ["Brand", product.brand || "BaseShop"],
                        ["Model", selectedVariant?.sku || product.slug || `Product-${product.id}`],
                      ].map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}
                    </tbody></table>
                  </div>
                )}
                {activeTab === "reviews" && (
                  <div className="row">
                    <div className="col-lg-4">
                      <div className="review-summary"><strong>{rating.toFixed(1)}</strong><span>out of 5</span><p>{reviewCount} customer reviews</p></div>
                    </div>
                    <div className="col-lg-8">
                      <div className="review-list">
                        <h4>Customer Reviews</h4>
                        {reviewsLoading ? <p>Loading reviews...</p> : reviewData.items.length === 0 ? <p>No reviews yet.</p> : reviewData.items.map((item) => (
                          <article className="review-item" key={item.id}>
                            <div className="review-item-header"><strong>{item.reviewerName}</strong> <time>{formatReviewDate(item.createdAt)}</time></div>
                            <div className="text-primary">{Array.from({ length: 5 }).map((_, i) => (<small key={i} className={`fa ${i < item.rating ? "fa-star" : "far fa-star"}`}></small>))}</div>
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
    </>
  );
};

const getActiveVariants = (product) => Array.isArray(product?.productVariants || product?.variants) ? (product?.productVariants || product?.variants).filter(v => v?.isActive !== false) : [];
const normalizeVariantValue = (value) => String(value || "").trim();
const getUniqueVariantValues = (variants, field) => Array.from(new Set(variants.map(v => normalizeVariantValue(v?.[field])).filter(Boolean)));
const getVariantStock = (variant) => { const s = Number(variant?.stockQuantity ?? variant?.stock); return Number.isFinite(s) ? Math.max(0, s) : 0; };
const getVariantPrice = (variant, product) => !variant ? (product?.price ?? product?.basePrice ?? 0) : (variant.salePrice ?? variant.price ?? product?.price ?? 0);
const getSafeQuantity = (v) => { const q = Number(v); return Number.isFinite(q) && q > 0 ? Math.floor(q) : 1; };
const normalizeImageUrl = (value) => String(value || "").trim().toLowerCase();
const createEmptyReviewData = () => ({ averageRating: 0, totalCount: 0, breakdown: [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percentage: 0 })), items: [] });
const normalizeReviewData = (data) => ({ averageRating: Number(data?.averageRating) || 0, totalCount: Number(data?.totalCount) || 0, breakdown: Array.isArray(data?.breakdown) ? data.breakdown : [], items: Array.isArray(data?.items) ? data.items : [] });
const formatReviewDate = (v) => { const d = new Date(v); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN"); };

export default ProductDetail;
