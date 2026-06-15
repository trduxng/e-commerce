import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="wrapper admin-shell">
            {/* Navbar */}
            <nav className="main-header navbar navbar-expand navbar-white navbar-light">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" data-widget="pushmenu" href="#" role="button">
                            <i className="fas fa-bars"></i>
                        </a>
                    </li>
                    <li className="nav-item d-none d-sm-inline-block">
                        <Link to="/" className="nav-link">Storefront</Link>
                    </li>
                </ul>

                <ul className="navbar-nav ml-auto">
                    <li className="nav-item d-flex align-items-center">
                        <span className="nav-link">
                            <i className="far fa-user mr-1"></i>
                            {user?.name || user?.username}
                        </span>
                        <button className="btn btn-sm btn-outline-danger mr-2" type="button" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt mr-1"></i> Logout
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Sidebar */}
            <aside className="main-sidebar sidebar-dark-primary elevation-4">
                <Link to="/" className="brand-link">
                    <span className="brand-text font-weight-light ml-3">
                        <b>Store</b> Sales
                    </span>
                </Link>

                <div className="sidebar">
                    <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                        <div className="image">
                            <i className="fas fa-user-circle fa-2x text-light"></i>
                        </div>
                        <div className="info">
                            <Link to="#" className="d-block">{user?.name || user?.username}</Link>
                        </div>
                    </div>

                    <nav className="mt-2">
                        <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                            <li className="nav-item">
                                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                                    <i className="nav-icon fas fa-tachometer-alt"></i>
                                    <p>Dashboard</p>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                                    <i className="nav-icon fas fa-box"></i>
                                    <p>Products</p>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                                    <i className="nav-icon fas fa-tags"></i>
                                    <p>Categories</p>
                                </Link>
                            </li>
                            {isAdmin() && (
                                <>
                                    <li className="nav-item">
                                        <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>Orders</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/revenue" className={`nav-link ${isActive('/revenue')}`}>
                                            <i className="nav-icon fas fa-coins"></i>
                                            <p>Revenue</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                                            <i className="nav-icon fas fa-users"></i>
                                            <p>Users</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/reviews" className={`nav-link ${isActive('/reviews')}`}>
                                            <i className="nav-icon fas fa-star"></i>
                                            <p>Reviews</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/coupons" className={`nav-link ${isActive('/coupons')}`}>
                                            <i className="nav-icon fas fa-ticket-alt"></i>
                                            <p>Coupons</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/manufacturers" className={`nav-link ${isActive('/manufacturers')}`}>
                                            <i className="nav-icon fas fa-industry"></i>
                                            <p>Manufacturers</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/specification-attributes" className={`nav-link ${isActive('/specification-attributes')}`}>
                                            <i className="nav-icon fas fa-cogs"></i>
                                            <p>Spec Attributes</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/checkout-attributes" className={`nav-link ${isActive('/checkout-attributes')}`}>
                                            <i className="nav-icon fas fa-shopping-basket"></i>
                                            <p>Checkout Attributes</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/current-carts" className={`nav-link ${isActive('/current-carts')}`}>
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>Current Carts</p>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Content */}
            {children}

            {/* Footer */}
            <footer className="main-footer">
                <strong>Copyright &copy; 2024 <a href="#">BaseCore Sales</a>.</strong>
                <div className="float-right d-none d-sm-inline-block">
                    <b>Version</b> 1.0.0
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
