import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  formatCurrency,
  getProductImage,
  getProductOldPrice,
  getProductPrice,
  getProductRating,
  getProductReviewCount,
  getProductStock,
} from "../data/shopData";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useFavorites } from "../contexts/FavoriteContext";

const ProductCard = ({ product, onFavoriteChange }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const rating = getProductRating(product);
  const stock = getProductStock(product);
  const price = getProductPrice(product);
  const oldPrice = getProductOldPrice(product);
  const isOnSale = oldPrice && oldPrice > price;
  const categoryName = product.category?.name || product.categoryName || "BaseShop";
  const favorite = isFavorite(product.id);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before updating favorites.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const result = await toggleFavorite(product.id);
    if (result.success) {
      toast.success(result.message);
      onFavoriteChange?.(product.id, result.isFavorite);
    } else {
      toast.error(result.message);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      toast.info("Please sign in before adding products to cart.");
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    const result = await addToCart(product);
    const message = result.message || (result.success ? "Product added to cart." : "Cannot add this product.");
    if (result.success) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const renderStars = () =>
    Array.from({ length: 5 }).map((_, index) => {
      const icon = index < Math.floor(rating) ? "fa-star" : index < rating ? "fa-star-half-alt" : "fa-star text-muted";
      return <small key={index} className={`fa ${icon} text-primary me-1`}></small>;
    });

  return (
    <div className="product-item bg-light mb-4">
      <div className="product-img position-relative overflow-hidden">
        <img className="img-fluid w-100" src={getProductImage(product)} alt={product.name} />
        <div className="product-badges">
          {isOnSale && <span className="product-badge product-badge-sale">Sale</span>}
          {stock === 0 && <span className="product-badge product-badge-muted">Sold out</span>}
        </div>
        <div className="product-action">
          <button
            type="button"
            className={`btn btn-square favorite-button ${favorite ? "is-favorite" : ""}`}
            title={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
            onClick={handleToggleFavorite}
          >
            <i className="fa fa-heart"></i>
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-square"
            title={stock === 0 ? "Out of stock" : "Add to cart"}
            disabled={stock === 0}
            onClick={handleAddToCart}
          >
            <i className="fa fa-shopping-cart"></i>
          </button>
          <Link className="btn btn-outline-dark btn-square" title="View details" to={`/product/${product.id}`}>
            <i className="fa fa-search"></i>
          </Link>
        </div>
      </div>
      <div className="product-card-body py-4 px-3">
        <div className="product-card-category">{categoryName}</div>
        <Link className="h6 text-decoration-none d-block" to={`/product/${product.id}`}>
          {product.name}
        </Link>
        <div className="product-price-row d-flex align-items-center mt-2">
          <h5>{formatCurrency(price)}</h5>
          {oldPrice && (
            <h6 className="text-muted ms-2">
              <del>{formatCurrency(oldPrice)}</del>
            </h6>
          )}
        </div>
        <div className="product-rating d-flex align-items-center mb-1">
          {renderStars()}
          <small>({getProductReviewCount(product)})</small>
        </div>
        {stock !== null && (
          <small className={stock > 0 ? "text-muted" : "text-danger"}>
            {stock > 0 ? `${stock} in stock` : "Out of stock"}
          </small>
        )}
        <div className="product-card-footer">
          <button
            type="button"
            className="btn btn-primary product-card-add"
            disabled={stock === 0}
            onClick={handleAddToCart}
          >
            <i className="fa fa-cart-plus me-2"></i>
            Add to cart
          </button>
          <Link className="btn btn-outline-dark product-card-view" to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
            <i className="fa fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};


export default ProductCard;
