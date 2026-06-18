import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const menuConfigs = {
    catalog: ['/admin/products', '/admin/categories', '/admin/manufacturers', '/admin/reviews'],
    sales: ['/admin/orders', '/admin/current-carts', '/admin/payments'],
    customers: ['/admin/users'],
    promotions: ['/admin/coupons'],
    config: ['/admin/settings', '/admin/specification-attributes', '/admin/checkout-attributes'],
    reports: ['/admin/revenue']
};

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isStaff } = useAuth();
    const { settings } = useSettings();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const [openMenus, setOpenMenus] = useState(() => {
        const initial = {};
        Object.keys(menuConfigs).forEach(key => {
            initial[key] = menuConfigs[key].includes(location.pathname);
        });
        return initial;
    });

    const toggleMenu = (menuKey) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    const handleToggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            setIsSidebarCollapsed(!isSidebarCollapsed);
        }
    };

    // Automatically close mobile sidebar on route changes
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        Object.keys(menuConfigs).forEach(key => {
            if (menuConfigs[key].includes(location.pathname)) {
                setOpenMenus(prev => ({
                    ...prev,
                    [key]: true
                }));
            }
        });
    }, [location.pathname]);

    // Close notifications click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    // Mock Notifications for admin header
    const mockNotifications = [
        { id: 1, type: 'warning', text: 'Sản phẩm "iPhone 15 Pro" sắp hết hàng (còn 2)', time: '5 phút trước' },
        { id: 2, type: 'info', text: 'Có đơn hàng mới #ORD-9482 cần xử lý', time: '12 phút trước' },
        { id: 3, type: 'danger', text: 'Giao dịch MoMo bị thất bại đối soát', time: '1 giờ trước' }
    ];

    return (
        <div className={`admin-shell wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
            
            {/* Sidebar mobile overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="sidebar-overlay d-md-none" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 998,
                        transition: 'opacity 0.25s ease'
                    }}
                />
            )}

            {/* Header */}
            <header className="main-header">
                <div className="d-flex align-items-center gap-3">
                    <button 
                        className="btn btn-light rounded-circle p-0 d-flex align-items-center justify-content-center" 
                        onClick={handleToggleSidebar}
                        style={{ width: '40px', height: '40px', border: '1px solid var(--app-border, #e2e8f0)', transition: 'all 0.2s' }}
                        aria-label="Toggle Sidebar"
                    >
                        <i className="fas fa-bars text-secondary" style={{ fontSize: '1.1rem' }}></i>
                    </button>
                    <div className="header-search-bar d-none d-md-block">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Tìm kiếm nhanh hệ thống..." />
                    </div>
                </div>

                <div className="navbar-nav ml-auto d-flex flex-row align-items-center gap-3">
                    {/* Storefront Link */}
                    <Link to="/" className="nav-link text-decoration-none" title="Về trang bán hàng">
                        <i className="fas fa-store mr-1"></i> <span className="d-none d-sm-inline">Storefront</span>
                    </Link>

                    {/* Notification popover */}
                    <div className="notification-badge-wrapper" ref={notificationRef}>
                        <button 
                            className="nav-link border-0 bg-transparent p-2 text-dark"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <i className="far fa-bell"></i>
                            <span className="badge badge-danger">3</span>
                        </button>

                        <div className={`header-dropdown-menu ${showNotifications ? 'show' : ''}`}>
                            <div className="dropdown-menu-header">Thông báo mới nhận</div>
                            <div className="dropdown-menu-body">
                                {mockNotifications.map(n => (
                                    <Link to="#" key={n.id} className="notification-item">
                                        <div className={`notification-icon-wrap ${n.type}`}>
                                            <i className={n.type === 'warning' ? 'fas fa-exclamation-triangle' : n.type === 'danger' ? 'fas fa-times-circle' : 'fas fa-shopping-bag'}></i>
                                        </div>
                                        <div className="notification-content">
                                            <p>{n.text}</p>
                                            <span>{n.time}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="d-flex align-items-center gap-2 border-left pl-3" style={{ borderColor: 'var(--app-border)' }}>
                        <i className="fas fa-user-circle fa-lg text-secondary"></i>
                        <span className="d-none d-sm-inline font-weight-bold" style={{ fontSize: '0.9rem' }}>
                            {user?.name || user?.username}
                        </span>
                        <button className="btn btn-sm btn-outline-danger border-0 p-2 ml-1" type="button" onClick={handleLogout} title="Đăng xuất">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className="main-sidebar">
                <Link to="/admin/dashboard" className="brand-link">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt={settings.storeName} className="brand-image img-circle" style={{ width: '30px', height: '30px' }} />
                    ) : (
                        <i className="fas fa-store brand-image text-white" style={{ fontSize: '1.2rem' }}></i>
                    )}
                    <span className="brand-text font-weight-bold ml-2">
                        {settings.storeName || 'BaseCore Admin'}
                    </span>
                </Link>

                <div className="sidebar-user-panel">
                    <i className="fas fa-user-shield fa-2x text-light"></i>
                    <div className="info">
                        <Link to="#" className="d-block">{user?.name || user?.username}</Link>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Quản trị viên</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-sidebar">
                        <li className="nav-item">
                            <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard')}`}>
                                <i className="nav-icon fas fa-tachometer-alt"></i>
                                <span className="menu-text">Bảng điều khiển</span>
                            </Link>
                        </li>
                        
                        {/* Catalog */}
                        <li className={`nav-item has-treeview ${openMenus.catalog ? 'menu-open' : ''}`}>
                            <div onClick={() => toggleMenu('catalog')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/products', '/admin/categories', '/admin/manufacturers', '/admin/reviews'].includes(location.pathname) ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-book"></i>
                                <span className="menu-text">Danh mục sản phẩm</span>
                                <i className="right fas fa-angle-left"></i>
                            </div>
                            {openMenus.catalog && (
                                <ul className="nav nav-treeview">
                                    <li className="nav-item">
                                        <Link to="/admin/products" className={`nav-link ${isActive('/admin/products')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Sản phẩm</span>
                                        </Link>
                                    </li>
                                    {isStaff() && (
                                        <li className="nav-item">
                                            <Link to="/admin/categories" className={`nav-link ${isActive('/admin/categories')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Thể loại</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="nav-item">
                                        <Link to="/admin/manufacturers" className={`nav-link ${isActive('/admin/manufacturers')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Nhà sản xuất</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/admin/reviews" className={`nav-link ${isActive('/admin/reviews')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Đánh giá sản phẩm</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Sales */}
                        {isStaff() && (
                            <li className={`nav-item has-treeview ${openMenus.sales ? 'menu-open' : ''}`}>
                                <div onClick={() => toggleMenu('sales')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/orders', '/admin/returns', '/admin/current-carts', '/admin/payments'].includes(location.pathname) ? 'active' : ''}`}>
                                    <i className="nav-icon fas fa-shopping-cart"></i>
                                    <span className="menu-text">Bán hàng</span>
                                    <i className="right fas fa-angle-left"></i>
                                </div>
                                {openMenus.sales && (
                                    <ul className="nav nav-treeview">
                                        <li className="nav-item">
                                            <Link to="/admin/orders" className={`nav-link ${isActive('/admin/orders')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Đơn hàng</span>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/returns" className={`nav-link ${isActive('/admin/returns')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Yêu cầu trả hàng</span>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/current-carts" className={`nav-link ${isActive('/admin/current-carts')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Quản lý trả hàng</span>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/payments" className={`nav-link ${isActive('/admin/payments')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Giao dịch thanh toán</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Customers */}
                        {isStaff() && (
                            <li className={`nav-item has-treeview ${openMenus.customers ? 'menu-open' : ''}`}>
                                <div onClick={() => toggleMenu('customers')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/users'].includes(location.pathname) ? 'active' : ''}`}>
                                    <i className="nav-icon far fa-user"></i>
                                    <span className="menu-text">Khách hàng</span>
                                    <i className="right fas fa-angle-left"></i>
                                </div>
                                {openMenus.customers && (
                                    <ul className="nav nav-treeview">
                                        <li className="nav-item">
                                            <Link to="/admin/users" className={`nav-link ${isActive('/admin/users')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Khách hàng</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Promotions */}
                        <li className={`nav-item has-treeview ${openMenus.promotions ? 'menu-open' : ''}`}>
                            <div onClick={() => toggleMenu('promotions')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/coupons'].includes(location.pathname) ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-tags"></i>
                                <span className="menu-text">Khuyến mãi</span>
                                <i className="right fas fa-angle-left"></i>
                            </div>
                            {openMenus.promotions && (
                                <ul className="nav nav-treeview">
                                    <li className="nav-item">
                                        <Link to="/admin/coupons" className={`nav-link ${isActive('/admin/coupons')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Mã giảm giá</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Configuration */}
                        <li className={`nav-item has-treeview ${openMenus.config ? 'menu-open' : ''}`}>
                            <div onClick={() => toggleMenu('config')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/settings', '/admin/specification-attributes', '/admin/checkout-attributes'].includes(location.pathname) ? 'active' : ''}`}>
                                <i className="nav-icon fas fa-cogs"></i>
                                <span className="menu-text">Cấu hình</span>
                                <i className="right fas fa-angle-left"></i>
                            </div>
                            {openMenus.config && (
                                <ul className="nav nav-treeview">
                                    {isStaff() && (
                                        <li className="nav-item">
                                            <Link to="/admin/settings" className={`nav-link ${isActive('/admin/settings')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Cài đặt</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="nav-item">
                                        <Link to="/admin/specification-attributes" className={`nav-link ${isActive('/admin/specification-attributes')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Thuộc tính kỹ thuật</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/admin/checkout-attributes" className={`nav-link ${isActive('/admin/checkout-attributes')}`}>
                                            <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                            <span className="menu-text">Thuộc tính thanh toán</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Reports */}
                        {isStaff() && (
                            <li className={`nav-item has-treeview ${openMenus.reports ? 'menu-open' : ''}`}>
                                <div onClick={() => toggleMenu('reports')} style={{ cursor: 'pointer' }} className={`nav-link ${['/admin/revenue'].includes(location.pathname) ? 'active' : ''}`}>
                                    <i className="nav-icon fas fa-chart-line"></i>
                                    <span className="menu-text">Báo cáo</span>
                                    <i className="right fas fa-angle-left"></i>
                                </div>
                                {openMenus.reports && (
                                    <ul className="nav nav-treeview">
                                        <li className="nav-item">
                                            <Link to="/admin/revenue" className={`nav-link ${isActive('/admin/revenue')}`}>
                                                <i className="far fa-circle nav-icon" style={{ fontSize: '0.75rem' }}></i>
                                                <span className="menu-text">Doanh thu</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}
                    </ul>
                </nav>
            </aside>

            {/* Content Area */}
            <main className="content-wrapper">
                {children || <Outlet />}
            </main>

            {/* Footer */}
            <footer className="main-footer">
                <span>Copyright &copy; 2026 <a href="#">BaseCore Sales</a>. Bản quyền đã được bảo lưu.</span>
                <div className="d-none d-sm-block">
                    <b>Phiên bản</b> 1.1.0
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
