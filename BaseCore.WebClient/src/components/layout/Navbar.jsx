import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { categoryApi } from "../../services/api";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getAll();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCategories(response.data);
        }
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className="container-fluid storefront-nav">
      <div className="row px-xl-5">
        <div className="col-lg-3 d-none d-lg-block">
          <button
            className="btn category-toggle d-flex align-items-center justify-content-between bg-primary w-100"
            type="button"
            aria-controls="navbar-vertical"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((current) => !current)}
            style={{ height: "65px", padding: "0 30px" }}
          >
            <h6 className="text-dark m-0">
              <i className="fa fa-bars me-2"></i>Categories
            </h6>
            <i className={`fa ${categoriesOpen ? "fa-angle-up" : "fa-angle-down"} text-dark`}></i>
          </button>
          <nav
            className={`category-menu navbar navbar-vertical navbar-light align-items-start p-0 bg-light ${categoriesOpen ? "is-open" : "is-closed"}`}
            id="navbar-vertical"
          >
            <div className="navbar-nav w-100">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  className="nav-item nav-link"
                  to={`/shop?categoryId=${category.id}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="col-lg-9">
          <nav className="navbar navbar-expand-lg navbar-dark py-3 py-lg-0 px-0">
            <Link to="/" className="storefront-brand text-decoration-none d-flex d-lg-none">
              <span className="brand-mark"><i className="fas fa-bag-shopping"></i></span>
              <span>BaseShop</span>
            </Link>

            <button
              type="button"
              className="navbar-toggler"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse"
              aria-controls="navbarCollapse"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse justify-content-between" id="navbarCollapse">
              <div className="navbar-nav me-auto py-0">
                <NavLink to="/" end className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Home
                </NavLink>
                <NavLink to="/shop" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Shop
                </NavLink>
                <NavLink to="/cart" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Cart
                </NavLink>
                {isAuthenticated && (
                  <NavLink to="/my-orders" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                    My Orders
                  </NavLink>
                )}
                <NavLink to="/checkout" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Checkout
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Contact
                </NavLink>
              </div>

              <div className="navbar-nav ms-auto py-0 d-none d-lg-block">
                <Link to="/cart" className="cart-button ms-3" aria-label="Shopping cart">
                  <i className="fas fa-shopping-cart"></i>
                  <span className="badge">
                    {count}
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
