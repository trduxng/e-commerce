import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const { settings } = useSettings();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        // Initialize AdminLTE plugins after render
        if (window.$) {
            if (window.$('[data-widget="treeview"]').length > 0) {
                window.$('[data-widget="treeview"]').Treeview('init');
            }
            if (window.$('[data-widget="pushmenu"]').length > 0) {
                window.$('[data-widget="pushmenu"]').PushMenu('init');
            }
        }
    }, [location.pathname]);

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
                <Link to="/dashboard" className="brand-link">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt={settings.storeName} className="brand-image img-circle elevation-3" style={{ opacity: '.8' }} />
                    ) : (
                        <i className="fas fa-store brand-image mt-1 ml-3" style={{ opacity: '.8' }}></i>
                    )}
                    <span className="brand-text font-weight-light ml-3">
                        <b>{settings.storeName}</b>
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
                        <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                            <li className="nav-item">
                                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                                    <i className="nav-icon fas fa-tachometer-alt"></i>
                                    <p>Dashboard</p>
                                </Link>
                            </li>
                            
                            <li className={`nav-item has-treeview ${['/products', '/categories', '/manufacturers', '/reviews'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                <a href="#" className={`nav-link ${['/products', '/categories', '/manufacturers', '/reviews'].includes(location.pathname) ? 'active' : ''}`}>
                                    <i className="nav-icon fas fa-book"></i>
                                    <p>
                                        Catalog
                                        <i className="right fas fa-angle-left"></i>
                                    </p>
                                </a>
                                <ul className="nav nav-treeview">
                                    <li className="nav-item">
                                        <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                                            <i className="far fa-dot-circle nav-icon"></i>
                                            <p>Products</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                                            <i className="far fa-dot-circle nav-icon"></i>
                                            <p>Categories</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/manufacturers" className={`nav-link ${isActive('/manufacturers')}`}>
                                            <i className="far fa-dot-circle nav-icon"></i>
                                            <p>Manufacturers</p>
                                        </Link>
                                    </li>
                                    {isAdmin() && (
                                    <li className="nav-item">
                                        <Link to="/reviews" className={`nav-link ${isActive('/reviews')}`}>
                                            <i className="far fa-dot-circle nav-icon"></i>
                                            <p>Product reviews</p>
                                        </Link>
                                    </li>
                                    )}
                                </ul>
                            </li>

                            {isAdmin() && (
                                <>
                                    <li className={`nav-item has-treeview ${['/orders', '/current-carts'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                        <a href="#" className={`nav-link ${['/orders', '/current-carts'].includes(location.pathname) ? 'active' : ''}`}>
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>
                                                Sales
                                                <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Orders</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/current-carts" className={`nav-link ${isActive('/current-carts')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Current Carts</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>

                                    <li className={`nav-item has-treeview ${['/users'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                        <a href="#" className={`nav-link ${['/users'].includes(location.pathname) ? 'active' : ''}`}>
                                            <i className="nav-icon far fa-user"></i>
                                            <p>
                                                Customers
                                                <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Customers</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>

                                    <li className={`nav-item has-treeview ${['/coupons'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                        <a href="#" className={`nav-link ${['/coupons'].includes(location.pathname) ? 'active' : ''}`}>
                                            <i className="nav-icon fas fa-tags"></i>
                                            <p>
                                                Promotions
                                                <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/coupons" className={`nav-link ${isActive('/coupons')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Discounts</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>

                                    <li className={`nav-item has-treeview ${['/settings', '/specification-attributes', '/checkout-attributes'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                        <a href="#" className={`nav-link ${['/settings', '/specification-attributes', '/checkout-attributes'].includes(location.pathname) ? 'active' : ''}`}>
                                            <i className="nav-icon fas fa-cogs"></i>
                                            <p>
                                                Configuration
                                                <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Settings</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/specification-attributes" className={`nav-link ${isActive('/specification-attributes')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Spec Attributes</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/checkout-attributes" className={`nav-link ${isActive('/checkout-attributes')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Checkout Attributes</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>

                                    <li className={`nav-item has-treeview ${['/revenue'].includes(location.pathname) ? 'menu-open' : ''}`}>
                                        <a href="#" className={`nav-link ${['/revenue'].includes(location.pathname) ? 'active' : ''}`}>
                                            <i className="nav-icon fas fa-chart-line"></i>
                                            <p>
                                                Reports
                                                <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/revenue" className={`nav-link ${isActive('/revenue')}`}>
                                                    <i className="far fa-dot-circle nav-icon"></i>
                                                    <p>Revenue</p>
                                                </Link>
                                            </li>
                                        </ul>
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
