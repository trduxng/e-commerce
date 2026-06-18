import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoriteContext";
import { useSettings } from "../../contexts/SettingsContext";
import ThemeToggle from "../ThemeToggle";

const Topbar = () => {
  const [keyword, setKeyword] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const accountMenuRef = useRef(null);
  const { user, isAuthenticated, logout, isAdmin, isManager } = useAuth();
  const { count } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { settings } = useSettings();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              aria-label="Mở hoặc đóng menu điều hướng"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="storefrontCompactNavbar">
              <div className="navbar-nav compact-main-links">
                <NavLink to="/" end className={navLinkClass}>Trang chủ</NavLink>
                <NavLink to="/shop" className={navLinkClass}>Cửa hàng</NavLink>
                <NavLink to="/cart" className={navLinkClass}>Giỏ hàng</NavLink>
                {isAuthenticated && <NavLink to="/favorites" className={navLinkClass}>Yêu thích</NavLink>}
                {isAuthenticated && <NavLink to="/my-orders" className={navLinkClass}>Đơn hàng của tôi</NavLink>}
                <NavLink to="/checkout" className={navLinkClass}>Thanh toán</NavLink>
                <NavLink to="/contact" className={navLinkClass}>Liên hệ</NavLink>
              </div>

              <form className="store-search compact-header-search" onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Tìm kiếm sản phẩm"
                    value={keyword}
                    onChange={handleSearchChange}
                  />
                  <div className="input-group-text p-0">
                    <button type="submit" className="btn" aria-label="Tìm kiếm sản phẩm">
                      <i className="fa fa-search"></i>
                    </button>
                  </div>
                </div>
              </form>

              <div className="compact-header-actions">
                <ThemeToggle />
                {isAuthenticated && (
                  <Link to="/favorites" className="cart-button" aria-label="Sản phẩm yêu thích">
                    <i className="fas fa-heart"></i>
                    <span className="badge">{favoriteCount}</span>
                  </Link>
                )}
                <Link to="/cart" className="cart-button" aria-label="Giỏ hàng">
                  <i className="fas fa-shopping-cart"></i>
                  <span className="badge">{count}</span>
                </Link>
                {isAuthenticated ? (
                  <div className="dropdown storefront-account-actions" ref={accountMenuRef}>
                    <button
                      className="cart-button"
                      type="button"
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      aria-expanded={showAccountMenu}
                      aria-label="Menu tài khoản"
                    >
                      <i className="far fa-user"></i>
                    </button>
                    <div className={`dropdown-menu dropdown-menu-end ${showAccountMenu ? 'show' : ''}`} style={{ display: showAccountMenu ? 'block' : 'none' }}>
                      <span className="dropdown-item-text">{user?.name || user?.username}</span>
                      <Link className="dropdown-item" to="/account" onClick={() => setShowAccountMenu(false)}>
                        <i className="fa fa-user-gear me-2"></i>
                        Tài khoản của tôi
                      </Link>
                      <Link className="dropdown-item" to="/my-orders" onClick={() => setShowAccountMenu(false)}>
                        <i className="fa fa-receipt me-2"></i>
                        Đơn hàng của tôi
                      </Link>
                      {(isAdmin() || isManager()) && (
                        <Link className="dropdown-item" to="/admin/dashboard" onClick={() => setShowAccountMenu(false)}>
                          <i className="fa fa-chart-line me-2"></i>
                          Bảng điều khiển
                        </Link>
                      )}
                      <button className="dropdown-item text-danger" type="button" onClick={() => { setShowAccountMenu(false); handleLogout(); }}>
                        <i className="fa fa-right-from-bracket me-2"></i>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="cart-button" aria-label="Đăng nhập">
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
