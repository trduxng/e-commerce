import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { categoryApi } from "../../services/api";
import { useCart } from "../../contexts/CartContext";

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const { count } = useCart();

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
    <div className="container-fluid bg-dark mb-30">
      <div className="row px-xl-5">
        <div className="col-lg-3 d-none d-lg-block">
          <button
            className="btn d-flex align-items-center justify-content-between bg-primary w-100"
            data-toggle="collapse"
            data-target="#navbar-vertical"
            type="button"
            style={{ height: "65px", padding: "0 30px" }}
          >
            <h6 className="text-dark m-0">
              <i className="fa fa-bars mr-2"></i>Categories
            </h6>
            <i className="fa fa-angle-down text-dark"></i>
          </button>
          <nav
            className="collapse show navbar navbar-vertical navbar-light align-items-start p-0 bg-light"
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
          <nav className="navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0">
            <Link to="/" className="text-decoration-none d-block d-lg-none">
              <span className="h1 text-uppercase text-dark bg-light px-2">Base</span>
              <span className="h1 text-uppercase text-light bg-primary px-2 ml-n1">Shop</span>
            </Link>

            <button
              type="button"
              className="navbar-toggler"
              data-toggle="collapse"
              data-target="#navbarCollapse"
              aria-controls="navbarCollapse"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse justify-content-between" id="navbarCollapse">
              <div className="navbar-nav mr-auto py-0">
                <NavLink to="/" end className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Home
                </NavLink>
                <NavLink to="/shop" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Shop
                </NavLink>
                <NavLink to="/cart" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Cart
                </NavLink>
                <NavLink to="/checkout" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Checkout
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => `nav-item nav-link ${isActive ? "active" : ""}`}>
                  Contact
                </NavLink>
              </div>

              <div className="navbar-nav ml-auto py-0 d-none d-lg-block">
                <Link to="/cart" className="btn px-0 ml-3">
                  <i className="fas fa-shopping-cart text-primary"></i>
                  <span className="badge text-secondary border border-secondary rounded-circle" style={{ paddingBottom: "2px" }}>
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
