import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoriteContext";
import { useSettings } from "../../contexts/SettingsContext";
import ThemeToggle from "../ThemeToggle";

const Topbar = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { settings } = useSettings();

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

  const navLinkClass = ({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="container-fluid compact-storefront-header">
      <div className="row px-xl-5">
        <div className="col-12">
          <nav className="navbar navbar-expand-xl compact-storefront-navbar px-0">
            <Link to="/" className="storefront-brand text-decoration-none d-flex align-items-center">
              {settings.logoUrl ? (
                 <img src={settings.logoUrl} alt={settings.storeName} style={{ height: '30px', marginRight: '10px' }} />
              ) : (
                 <span className="brand-mark"><i className="fas fa-bag-shopping"></i></span>
              )}
              <span>{settings.storeName}</span>
            </Link>

            <button
              type="button"
              className="navbar-toggler"
              data-bs-toggle="collapse"
              data-bs-target="#storefrontCompactNavbar"
              aria-controls="storefrontCompactNavbar"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="storefrontCompactNavbar">
              <div className="navbar-nav compact-main-links">
                <NavLink to="/" end className={navLinkClass}>Home</NavLink>
                <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
                <NavLink to="/cart" className={navLinkClass}>Cart</NavLink>
                {isAuthenticated && <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>}
                {isAuthenticated && <NavLink to="/my-orders" className={navLinkClass}>My Orders</NavLink>}
                <NavLink to="/checkout" className={navLinkClass}>Checkout</NavLink>
                <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
              </div>

              <form className="store-search compact-header-search" onSubmit={handleSearch}>
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

              <div className="compact-header-actions">
                <ThemeToggle />
                {isAuthenticated && (
                  <Link to="/favorites" className="cart-button" aria-label="Favorite products">
                    <i className="fas fa-heart"></i>
                    <span className="badge">{favoriteCount}</span>
                  </Link>
                )}
                <Link to="/cart" className="cart-button" aria-label="Shopping cart">
                  <i className="fas fa-shopping-cart"></i>
                  <span className="badge">{count}</span>
                </Link>
                {isAuthenticated ? (
                  <div className="dropdown storefront-account-actions">
                    <button
                      className="cart-button"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label="Account menu"
                    >
                      <i className="far fa-user"></i>
                    </button>
                    <div className="dropdown-menu dropdown-menu-end">
                      <span className="dropdown-item-text">{user?.name || user?.username}</span>
                      <Link className="dropdown-item" to="/account">
                        <i className="fa fa-user-gear me-2"></i>
                        My Account
                      </Link>
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
                  <Link to="/login" className="cart-button" aria-label="Sign in">
                    <i className="far fa-user"></i>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
