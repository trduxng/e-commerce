import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

const Topbar = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (location.pathname === "/shop") {
      const searchParams = new URLSearchParams(location.search);
      setKeyword(searchParams.get("keyword") || "");
    }
  }, [location.pathname, location.search]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setKeyword(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const query = value.trim();
      navigate(query ? `/shop?keyword=${encodeURIComponent(query)}` : "/shop");
    }, 500);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const query = keyword.trim();
    navigate(query ? `/shop?keyword=${encodeURIComponent(query)}` : "/shop");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="container-fluid">
      <div className="row storefront-topbar py-2 px-xl-5">
        <div className="col-lg-6 d-none d-lg-block">
          <div className="d-inline-flex align-items-center h-100">
            <Link className="text-body me-3" to="/">Home</Link>
            <Link className="text-body me-3" to="/shop">Shop</Link>
            <Link className="text-body me-3" to="/contact">Contact</Link>
            {isAuthenticated && isAdmin() && <Link className="text-body me-3" to="/dashboard">Admin</Link>}
          </div>
        </div>

        <div className="col-lg-6 text-center text-lg-end">
          <div className="d-inline-flex align-items-center">
            {isAuthenticated ? (
              <div className="dropdown storefront-account-actions">
                <button
                  className="btn btn-sm btn-light dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="far fa-user me-1"></i>
                  {user?.name || user?.username}
                </button>
                <div className="dropdown-menu dropdown-menu-end">
                  <Link className="dropdown-item" to="/my-orders">
                    <i className="fa fa-receipt me-2"></i>
                    My Orders
                  </Link>
                  {isAdmin() && (
                    <Link className="dropdown-item" to="/dashboard">
                      <i className="fa fa-chart-line me-2"></i>
                      Dashboard
                    </Link>
                  )}
                  <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                    <i className="fa fa-right-from-bracket me-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="storefront-account-actions d-inline-flex align-items-center">
                <Link className="btn btn-sm btn-light" to="/login">Login</Link>
                <Link className="btn btn-sm btn-primary ms-2" to="/register">Register</Link>
              </div>
            )}

            <div className="btn-group mx-2 d-none d-sm-inline-flex">
              <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                VND
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                <button className="dropdown-item" type="button">VND</button>
                <button className="dropdown-item" type="button">USD</button>
              </div>
            </div>

            <div className="btn-group d-none d-sm-inline-flex">
              <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                VI
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                <button className="dropdown-item" type="button">VI</button>
                <button className="dropdown-item" type="button">EN</button>
              </div>
            </div>
          </div>

          <div className="d-inline-flex align-items-center d-lg-none">
            <Link to="/cart" className="cart-button ms-2" aria-label="Shopping cart">
              <i className="fas fa-shopping-cart"></i>
              <span className="badge">
                {count}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="row align-items-center mobile-search-row px-xl-5 d-lg-none">
        <div className="col-12">
          <form className="store-search" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="search"
                className="form-control"
                placeholder="Search for products"
                value={keyword}
                onChange={handleSearchChange}
              />
              <div className="input-group-text p-0">
                <button type="submit" className="btn" aria-label="Search products">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="row align-items-center py-3 px-xl-5 d-none d-lg-flex">
        <div className="col-lg-4">
          <Link to="/" className="storefront-brand text-decoration-none">
            <span className="brand-mark"><i className="fas fa-bag-shopping"></i></span>
            <span>BaseShop</span>
          </Link>
        </div>

        <div className="col-lg-5 col-6 text-start">
          <form className="store-search" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="search"
                className="form-control"
                placeholder="Search for products"
                value={keyword}
                onChange={handleSearchChange}
              />
              <div className="input-group-text p-0">
                <button type="submit" className="btn" aria-label="Search products">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-lg-3 col-6 text-end">
          <p className="m-0 text-muted fw-bold">Customer Service</p>
          <h5 className="m-0 fw-bold">+84 909 123 456</h5>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
