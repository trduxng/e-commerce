import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { favoriteApi } from "../services/api";
import { useFavorites } from "../contexts/FavoriteContext";
import { useToast } from "../contexts/ToastContext";
import { getApiErrorMessage, normalizeProductList } from "../data/shopData";

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
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách sản phẩm yêu thích."));
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
              <Link className="breadcrumb-item text-dark" to="/">Trang chủ</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Cửa hàng</Link>
              <span className="breadcrumb-item active">Yêu thích</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <div className="shop-toolbar d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-4">
              <div>
                <h4 className="mb-1">Sản phẩm yêu thích</h4>
                <small className="text-muted">
                  {loading ? "Đang tải danh sách yêu thích..." : `${products.length} sản phẩm đã lưu`}
                </small>
              </div>
              <Link to="/shop" className="btn btn-outline-dark mt-3 mt-lg-0">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="col-12">
              <div className="shop-empty-state bg-light p-5 text-center">
                <h5>Chưa có sản phẩm yêu thích</h5>
                <p>Hãy thêm sản phẩm từ cửa hàng để xem lại tại đây.</p>
                <Link to="/shop" className="btn btn-primary">Khám phá sản phẩm</Link>
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
