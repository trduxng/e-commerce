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
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await productApi.getById(id);
        const loadedProduct = response.data;
        setProduct(loadedProduct);
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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    addToCart(product, quantity);
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
              <img className="w-100 img-fluid" src={getProductImage(product)} alt={product.name} />
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
              <h3 className="font-weight-semi-bold mb-4">{formatCurrency(product.price)}</h3>
              <p className="mb-4">{product.description || "A quality product ready for everyday use."}</p>
              <p className="mb-2">
                <strong>Category:</strong> {getProductCategoryName(product, [])}
              </p>
              <p className="mb-4">
                <strong>Stock:</strong> {product.stock ?? "Available"}
              </p>

              <div className="d-flex align-items-center mb-4 pt-2">
                <div className="input-group quantity mr-3" style={{ width: "130px" }}>
                  <div className="input-group-btn">
                    <button
                      type="button"
                      className="btn btn-primary btn-minus"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >
                      <i className="fa fa-minus"></i>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control bg-secondary border-0 text-center"
                    value={quantity}
                    readOnly
                  />
                  <div className="input-group-btn">
                    <button
                      type="button"
                      className="btn btn-primary btn-plus"
                      onClick={() => setQuantity((value) => value + 1)}
                    >
                      <i className="fa fa-plus"></i>
                    </button>
                  </div>
                </div>
                <button type="button" className="btn btn-primary px-3" onClick={handleAddToCart}>
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

export default ProductDetail;
