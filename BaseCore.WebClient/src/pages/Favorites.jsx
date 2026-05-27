import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { favoriteApi } from "../services/api";
import { useFavorites } from "../contexts/FavoriteContext";
import { useToast } from "../contexts/ToastContext";
import { normalizeProductList } from "../data/shopData";

const Favorites = () => {
  const toast = useToast();
  const { reloadFavorites } = useFavorites();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoriteApi.getAll();
      setProducts(normalizeProductList(response.data));
      await reloadFavorites();
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.Message || "Cannot load favorite products.";
      toast.error(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteChange = (productId, isFavorite) => {
    if (!isFavorite) {
      setProducts((current) => current.filter((product) => Number(product.id) !== Number(productId)));
    }
  };

  return (
    <div className="shop-page">
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb shop-breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Shop</Link>
              <span className="breadcrumb-item active">Favorites</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <div className="shop-toolbar d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-4">
              <div>
                <h4 className="mb-1">Favorite products</h4>
                <small className="text-muted">
                  {loading ? "Loading favorites..." : `${products.length} saved products`}
                </small>
              </div>
              <Link to="/shop" className="btn btn-outline-dark mt-3 mt-lg-0">
                Continue Shopping
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="col-12">
              <div className="shop-empty-state bg-light p-5 text-center">
                <h5>No favorite products yet</h5>
                <p>Add products from the shop to see them here.</p>
                <Link to="/shop" className="btn btn-primary">Browse Products</Link>
              </div>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 pb-1">
                <ProductCard product={product} onFavoriteChange={handleFavoriteChange} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
