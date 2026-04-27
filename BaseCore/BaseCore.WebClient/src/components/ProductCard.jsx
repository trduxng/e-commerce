import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency, getProductImage } from "../data/shopData";
import { useCart } from "../contexts/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const rating = Number(product.rating || 4);

  const renderStars = () =>
    Array.from({ length: 5 }).map((_, index) => {
      const icon = index < Math.floor(rating) ? "fa-star" : index < rating ? "fa-star-half-alt" : "fa-star text-muted";
      return <small key={index} className={`fa ${icon} text-primary mr-1`}></small>;
    });

  return (
    <div className="product-item bg-light mb-4">
      <div className="product-img position-relative overflow-hidden">
        <img className="img-fluid w-100" src={getProductImage(product)} alt={product.name} />
        <div className="product-action">
          <button
            type="button"
            className="btn btn-outline-dark btn-square"
            title="Add to cart"
            onClick={() => addToCart(product)}
          >
            <i className="fa fa-shopping-cart"></i>
          </button>
          <Link className="btn btn-outline-dark btn-square" title="View details" to={`/product/${product.id}`}>
            <i className="fa fa-search"></i>
          </Link>
        </div>
      </div>
      <div className="text-center py-4 px-3">
        <Link className="h6 text-decoration-none text-truncate d-block" to={`/product/${product.id}`}>
          {product.name}
        </Link>
        <div className="d-flex align-items-center justify-content-center mt-2">
          <h5>{formatCurrency(product.price)}</h5>
          {product.oldPrice && (
            <h6 className="text-muted ml-2">
              <del>{formatCurrency(product.oldPrice)}</del>
            </h6>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-center mb-1">
          {renderStars()}
          <small>({product.reviewCount || 24})</small>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
