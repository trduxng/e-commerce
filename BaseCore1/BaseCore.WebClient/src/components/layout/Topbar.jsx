import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

const Topbar = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();

  const handleSearch = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/shop?keyword=${encodeURIComponent(query)}` : "/shop");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="container-fluid">
      <div className="row bg-secondary py-1 px-xl-5">
        <div className="col-lg-6 d-none d-lg-block">
          <div className="d-inline-flex align-items-center h-100">
            <Link className="text-body mr-3" to="/">Home</Link>
            <Link className="text-body mr-3" to="/shop">Shop</Link>
            <Link className="text-body mr-3" to="/contact">Contact</Link>
            {isAuthenticated && <Link className="text-body mr-3" to="/dashboard">Admin</Link>}
          </div>
        </div>

        <div className="col-lg-6 text-center text-lg-right">
          <div className="d-inline-flex align-items-center">
            {isAuthenticated ? (
              <div className="d-inline-flex align-items-center">
                <span className="btn btn-sm btn-light disabled">
                  <i className="far fa-user mr-1"></i>
                  {user?.name || user?.username}
                </span>
                <Link className="btn btn-sm btn-light ml-2" to="/dashboard">Dashboard</Link>
                <button className="btn btn-sm btn-primary ml-2" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-inline-flex align-items-center">
                <Link className="btn btn-sm btn-light" to="/login">Login</Link>
                <Link className="btn btn-sm btn-primary ml-2" to="/register">Register</Link>
              </div>
            )}

            <div className="btn-group mx-2">
              <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-toggle="dropdown">
                VND
              </button>
              <div className="dropdown-menu dropdown-menu-right">
                <button className="dropdown-item" type="button">VND</button>
                <button className="dropdown-item" type="button">USD</button>
              </div>
            </div>

            <div className="btn-group">
              <button type="button" className="btn btn-sm btn-light dropdown-toggle" data-toggle="dropdown">
                VI
              </button>
              <div className="dropdown-menu dropdown-menu-right">
                <button className="dropdown-item" type="button">VI</button>
                <button className="dropdown-item" type="button">EN</button>
              </div>
            </div>
          </div>

          <div className="d-inline-flex align-items-center d-block d-lg-none">
            <Link to="/cart" className="btn px-0 ml-2">
              <i className="fas fa-shopping-cart text-dark"></i>
              <span className="badge text-dark border border-dark rounded-circle" style={{ paddingBottom: "2px" }}>
                {count}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex">
        <div className="col-lg-4">
          <Link to="/" className="text-decoration-none">
            <span className="h1 text-uppercase text-primary bg-dark px-2">Base</span>
            <span className="h1 text-uppercase text-dark bg-primary px-2 ml-n1">Shop</span>
          </Link>
        </div>

        <div className="col-lg-4 col-6 text-left">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="search"
                className="form-control"
                placeholder="Search for products"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <div className="input-group-append">
                <button type="submit" className="input-group-text bg-transparent text-primary border-left-0">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-lg-4 col-6 text-right">
          <p className="m-0">Customer Service</p>
          <h5 className="m-0">+84 909 123 456</h5>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
