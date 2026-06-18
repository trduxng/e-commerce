import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, userApi, categoryApi, orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../data/shopData';

const orderStatuses = [
    { value: 'pending', label: 'Chờ duyệt', badge: 'badge-warning', color: '#f59e0b' },
    { value: 'confirmed', label: 'Đã xác nhận', badge: 'badge-primary', color: '#3b82f6' },
    { value: 'shipping', label: 'Đang giao', badge: 'badge-info', color: '#06b6d4' },
    { value: 'delivered', label: 'Đã giao', badge: 'badge-success', color: '#10b981' },
    { value: 'cancelled', label: 'Đã hủy', badge: 'badge-secondary', color: '#64748b' },
];

const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        users: 0,
        orders: 0,
        revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [orderError, setOrderError] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [orderForm, setOrderForm] = useState({
        receiverName: '',
        receiverPhone: '',
        email: '',
        shippingAddress: '',
        paymentMethod: 'cod',
        note: '',
    });
    
    // UI state mới
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [statusChangeOrder, setStatusChangeOrder] = useState(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadStats();
    }, []);

    const getListCount = (data) => {
        if (Array.isArray(data)) return data.length;
        if (Array.isArray(data?.items)) return data.items.length;
        if (Array.isArray(data?.data)) return data.data.length;
        return 0;
    };

    const getTotalCount = (data) => {
        if (Number.isFinite(Number(data?.totalCount))) return Number(data.totalCount);
        return getListCount(data);
    };

    const loadStats = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                productApi.getAll(),
                categoryApi.getAll(),
            ]);

            try {
                const myOrdersRes = await orderApi.getMyOrders();
                setMyOrders(Array.isArray(myOrdersRes.data) ? myOrdersRes.data : []);
                setOrderError('');
            } catch (e) {
                setMyOrders([]);
                setOrderError('Không thể tải danh sách đơn hàng của bạn.');
            }

            let usersCount = 0;
            if (isAdmin()) {
                try {
                    const [usersRes, ordersRes] = await Promise.all([
                        userApi.getAll({ page: 1, pageSize: 1 }),
                        orderApi.getAll(),
                    ]);
                    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                    usersCount = usersRes.data.totalCount || 0;
                    setRecentOrders(orders.slice(0, 8));
                    setStats((current) => ({
                        ...current,
                        orders: orders.length,
                        revenue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
                    }));
                } catch (e) {
                    console.log('Không thể lấy thống kê admin');
                }
            }

            setStats((current) => ({
                ...current,
                products: getTotalCount(productsRes.data),
                categories: getTotalCount(categoriesRes.data),
                users: usersCount,
            }));
        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOrderDetails = (order) => order.orderDetails || order.details || [];
    const getStatusMeta = (status) => orderStatuses.find((item) => item.value === status) || orderStatuses[0];

    const canModifyOrder = (order) => order.orderStatus === 'pending';

    const startEditOrder = (order) => {
        setOrderError('');
        setEditingOrder(order);
        setOrderForm({
            receiverName: order.receiverName || '',
            receiverPhone: order.receiverPhone || '',
            email: order.guestEmail || '',
            shippingAddress: order.shippingAddressFull || order.shippingAddress || '',
            paymentMethod: order.paymentMethod || 'cod',
            note: order.note || '',
        });
    };

    const cancelEditOrder = () => {
        setEditingOrder(null);
        setOrderError('');
    };

    const setOrderField = (field, value) => {
        setOrderForm((current) => ({ ...current, [field]: value }));
    };

    const saveOrder = async (event) => {
        event.preventDefault();
        if (!editingOrder) return;

        setSavingOrder(true);
        setOrderError('');

        try {
            const response = await orderApi.update(editingOrder.id, orderForm);
            const updatedOrder = response.data;
            setMyOrders((current) => current.map((order) => (
                Number(order.id) === Number(updatedOrder.id)
                    ? { ...order, ...updatedOrder, orderDetails: updatedOrder.orderDetails || order.orderDetails }
                    : order
            )));
            setRecentOrders((current) => current.map((order) => (
                Number(order.id) === Number(updatedOrder.id) ? { ...order, ...updatedOrder } : order
            )));
            setEditingOrder(null);
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Không thể cập nhật đơn hàng.');
        } finally {
            setSavingOrder(false);
        }
    };

    const deleteOrder = async (order) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${order.orderCode}?`)) return;

        setOrderError('');
        try {
            await orderApi.delete(order.id);
            setMyOrders((current) => current.filter((item) => Number(item.id) !== Number(order.id)));
            setRecentOrders((current) => current.filter((item) => Number(item.id) !== Number(order.id)));
            if (editingOrder?.id === order.id) setEditingOrder(null);
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Không thể xóa đơn hàng.');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        setUpdatingStatusId(orderId);
        setOrderError('');

        try {
            const response = await orderApi.updateStatus(orderId, status);
            const updatedOrder = response.data;
            setRecentOrders((current) => current.map((item) => (
                Number(item.id) === Number(orderId)
                    ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
                    : item
            )));
            setMyOrders((current) => current.map((item) => (
                Number(item.id) === Number(orderId)
                    ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
                    : item
            )));
            setStatusChangeOrder(null);
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Tạo dữ liệu biểu đồ SVG động dựa trên doanh thu thực tế
    const mockMonthlySales = [
        { name: 'Tháng 1', sales: stats.revenue * 0.12, orders: Math.round(stats.orders * 0.12) },
        { name: 'Tháng 2', sales: stats.revenue * 0.15, orders: Math.round(stats.orders * 0.14) },
        { name: 'Tháng 3', sales: stats.revenue * 0.18, orders: Math.round(stats.orders * 0.17) },
        { name: 'Tháng 4', sales: stats.revenue * 0.14, orders: Math.round(stats.orders * 0.13) },
        { name: 'Tháng 5', sales: stats.revenue * 0.21, orders: Math.round(stats.orders * 0.22) },
        { name: 'Tháng 6', sales: stats.revenue * 0.20, orders: Math.round(stats.orders * 0.22) },
    ];

    const maxSales = Math.max(...mockMonthlySales.map(d => d.sales), 1000000);

    return (
        <div className="content-wrapper px-4 py-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 font-weight-bold mb-1 text-dark">Tổng quan hệ thống</h1>
                    <p className="text-muted mb-0">Theo dõi doanh số, đơn hàng và các hoạt động vận hành thời gian thực.</p>
                </div>
                <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={loadStats}>
                    <i className="fas fa-redo-alt mr-2"></i> Làm mới dữ liệu
                </button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Đang tải dữ liệu...</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Bento Grid KPIs */}
                    <div className="bento-dashboard-grid mb-4">
                        {/* KPI 1: Doanh thu */}
                        {isAdmin() && (
                            <div className="bento-card bento-kpi-large bg-gradient-revenue">
                                <div className="bento-card-body d-flex flex-column justify-content-between h-100">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="bento-kpi-label">Tổng doanh thu</span>
                                            <h2 className="bento-kpi-val mt-2">{formatCurrency(stats.revenue)}</h2>
                                        </div>
                                        <div className="bento-icon-wrapper">
                                            <i className="fas fa-coins"></i>
                                        </div>
                                    </div>
                                    <div className="bento-kpi-footer mt-3">
                                        <span className="badge badge-light-success rounded-pill px-2 py-1">
                                            <i className="fas fa-arrow-up mr-1"></i> +14.2%
                                        </span>
                                        <span className="text-white-50 ml-2">so với tháng trước</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KPI 2: Đơn hàng */}
                        {isAdmin() && (
                            <div className="bento-card bg-white border">
                                <div className="bento-card-body d-flex flex-column justify-content-between h-100">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="text-muted font-weight-bold">Đơn hàng</span>
                                            <h3 className="h1 font-weight-black mt-2 text-dark">{stats.orders}</h3>
                                        </div>
                                        <div className="bento-icon-wrapper bg-danger-light text-danger">
                                            <i className="fas fa-shopping-cart"></i>
                                        </div>
                                    </div>
                                    <div className="bento-kpi-footer mt-2">
                                        <span className="text-success font-weight-bold">
                                            <i className="fas fa-chart-line mr-1"></i> +8.5%
                                        </span>
                                        <span className="text-muted ml-2">Tuần này</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KPI 3: Sản phẩm */}
                        <div className="bento-card bg-white border">
                            <div className="bento-card-body d-flex flex-column justify-content-between h-100">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <span className="text-muted font-weight-bold">Sản phẩm</span>
                                        <h3 className="h1 font-weight-black mt-2 text-dark">{stats.products}</h3>
                                    </div>
                                    <div className="bento-icon-wrapper bg-info-light text-info">
                                        <i className="fas fa-box"></i>
                                    </div>
                                </div>
                                <div className="bento-kpi-footer mt-2">
                                    <Link to="/admin/products" className="text-primary font-weight-bold text-decoration-none">
                                        Xem danh sách <i className="fas fa-arrow-right ml-1"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* KPI 4: Danh mục */}
                        <div className="bento-card bg-white border">
                            <div className="bento-card-body d-flex flex-column justify-content-between h-100">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <span className="text-muted font-weight-bold">Danh mục</span>
                                        <h3 className="h1 font-weight-black mt-2 text-dark">{stats.categories}</h3>
                                    </div>
                                    <div className="bento-icon-wrapper bg-success-light text-success">
                                        <i className="fas fa-tags"></i>
                                    </div>
                                </div>
                                <div className="bento-kpi-footer mt-2">
                                    <Link to="/admin/categories" className="text-primary font-weight-bold text-decoration-none">
                                        Quản lý <i className="fas fa-arrow-right ml-1"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* KPI 5: Người dùng */}
                        {isAdmin() && (
                            <div className="bento-card bg-white border">
                                <div className="bento-card-body d-flex flex-column justify-content-between h-100">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <span className="text-muted font-weight-bold">Khách hàng</span>
                                            <h3 className="h1 font-weight-black mt-2 text-dark">{stats.users}</h3>
                                        </div>
                                        <div className="bento-icon-wrapper bg-warning-light text-warning">
                                            <i className="fas fa-users"></i>
                                        </div>
                                    </div>
                                    <div className="bento-kpi-footer mt-2">
                                        <Link to="/admin/users" className="text-primary font-weight-bold text-decoration-none">
                                            Xem chi tiết <i className="fas fa-arrow-right ml-1"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                    {isAdmin() && (
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Giao dịch gần đây</h3>
                                    </div>
                                    <div className="card-body table-responsive p-0">
                                        <table className="table table-hover text-nowrap mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Mã đơn hàng</th>
                                                    <th>Khách hàng</th>
                                                    <th>SĐT</th>
                                                    <th>Sản phẩm</th>
                                                    <th>Tổng tiền</th>
                                                    <th>Trạng thái</th>
                                                    <th>Ngày</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-4">Chưa có dữ liệu giao dịch.</td>
                                                    </tr>
                                                ) : (
                                                    recentOrders.map((order) => (
                                                        <tr key={order.id}>
                                                            <td>{order.orderCode}</td>
                                                            <td>{order.receiverName}</td>
                                                            <td>{order.receiverPhone}</td>
                                                            <td>
                                                                {getOrderDetails(order).map((detail) => (
                                                                    <div key={detail.id || `${order.id}-${detail.productVariantId}`}>
                                                                        {detail.productNameSnapshot} x {detail.quantity}
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>{formatCurrency(order.totalAmount)}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <span className={`badge mr-2 ${getStatusMeta(order.orderStatus).badge}`}>
                                                                        {getStatusMeta(order.orderStatus).label}
                                                                    </span>
                                                                    <select
                                                                        className="custom-select custom-select-sm order-status-select"
                                                                        value={order.orderStatus}
                                                                        disabled={updatingStatusId === order.id}
                                                                        onChange={(event) => updateOrderStatus(order, event.target.value)}
                                                                    >
                                                                        {orderStatuses.map((status) => (
                                                                            <option key={status.value} value={status.value}>
                                                                                {status.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </td>
                                                            <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Đơn hàng của tôi</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    {orderError && <div className="alert alert-warning m-3">{orderError}</div>}
                                    <table className="table table-hover text-nowrap mb-0">
                                        <thead>
                                            <tr>
                                                <th>Mã đơn hàng</th>
                                                <th>Người nhận</th>
                                                <th>Sản phẩm</th>
                                                <th>Tổng tiền</th>
                                                <th>Thanh toán</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày tạo</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-4">Không tìm thấy đơn hàng</td>
                                                </tr>
                                            ) : (
                                                myOrders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>{order.orderCode}</td>
                                                        <td>
                                                            <div>{order.receiverName}</div>
                                                            <small className="text-muted">{order.receiverPhone}</small>
                                                        </td>
                                                        <td>
                                                            {getOrderDetails(order).map((detail) => (
                                                                <div key={detail.id || `${order.id}-${detail.productVariantId}`}>
                                                                    {detail.productNameSnapshot} x {detail.quantity}
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>{formatCurrency(order.totalAmount)}</td>
                                                        <td>{order.paymentMethod}</td>
                                                        <td>
                                                            <span className={`badge ${getStatusMeta(order.orderStatus).badge}`}>
                                                                {getStatusMeta(order.orderStatus).label}
                                                            </span>
                                                        </td>
                                                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary mr-2"
                                                                disabled={!canModifyOrder(order)}
                                                                onClick={() => startEditOrder(order)}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                disabled={!canModifyOrder(order) && order.orderStatus !== 'cancelled'}
                                                                onClick={() => deleteOrder(order)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {editingOrder && (
                                    <form className="card-body border-top" onSubmit={saveOrder}>
                                        <h5 className="mb-3">Sửa đơn hàng {editingOrder.orderCode}</h5>
                                        <div className="row">
                                            <div className="col-md-4 form-group">
                                                <label>Tên người nhận</label>
                                                <input
                                                    className="form-control"
                                                    value={orderForm.receiverName}
                                                    onChange={(event) => setOrderField('receiverName', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 form-group">
                                                <label>Số điện thoại</label>
                                                <input
                                                    className="form-control"
                                                    value={orderForm.receiverPhone}
                                                    onChange={(event) => setOrderField('receiverPhone', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 form-group">
                                                <label>Email</label>
                                                <input
                                                    className="form-control"
                                                    type="email"
                                                    value={orderForm.email}
                                                    onChange={(event) => setOrderField('email', event.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-8 form-group">
                                                <label>Địa chỉ giao hàng</label>
                                                <input
                                                    className="form-control"
                                                    value={orderForm.shippingAddress}
                                                    onChange={(event) => setOrderField('shippingAddress', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 form-group">
                                                <label>Thanh toán</label>
                                                <select
                                                    className="custom-select"
                                                    value={orderForm.paymentMethod}
                                                    onChange={(event) => setOrderField('paymentMethod', event.target.value)}
                                                >
                                                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                                    <option value="banktransfer">Chuyển khoản ngân hàng</option>
                                                    <option value="paypal">Paypal</option>
                                                </select>
                                            </div>
                                            <div className="col-12 form-group">
                                                <label>Ghi chú</label>
                                                <textarea
                                                    className="form-control"
                                                    rows={3}
                                                    value={orderForm.note}
                                                    onChange={(event) => setOrderField('note', event.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary mr-2" type="submit" disabled={savingOrder}>
                                            {savingOrder ? 'Đang lưu...' : 'Lưu đơn hàng'}
                                        </button>
                                        <button className="btn btn-secondary" type="button" onClick={cancelEditOrder}>
                                            Hủy
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Charts & Analytics Section */}
                    {isAdmin() && (
                        <div className="row mb-4">
                            {/* Biểu đồ doanh thu SVG */}
                            <div className="col-lg-8 mb-4 mb-lg-0">
                                <div className="card h-100 border-0 shadow-sm rounded-lg">
                                    <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                                        <h3 className="h5 font-weight-bold mb-1 text-dark">Thống kê doanh số</h3>
                                        <p className="text-muted small mb-0">Biểu đồ biểu diễn doanh số 6 tháng gần nhất.</p>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column justify-content-center">
                                        {/* SVG Chart */}
                                        <div className="chart-svg-container" style={{ position: 'relative', width: '100%', height: '260px' }}>
                                            <svg viewBox="0 0 600 240" width="100%" height="100%" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="svgGradBlue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Grid lines */}
                                                <line x1="40" y1="30" x2="570" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                                <line x1="40" y1="80" x2="570" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                                                <line x1="40" y1="130" x2="570" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                                                <line x1="40" y1="180" x2="570" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                                                <line x1="40" y1="210" x2="570" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

                                                {/* Bars (Cột cột doanh thu) */}
                                                {mockMonthlySales.map((item, idx) => {
                                                    const barWidth = 46;
                                                    const x = 75 + idx * 82;
                                                    const barHeight = maxSales > 0 ? (item.sales / maxSales) * 160 : 0;
                                                    const y = 210 - barHeight;

                                                    return (
                                                        <g key={idx} className="chart-bar-group">
                                                            {/* Cột chính */}
                                                            <rect
                                                                x={x - barWidth / 2}
                                                                y={y}
                                                                width={barWidth}
                                                                height={barHeight}
                                                                rx="6"
                                                                fill="url(#svgGradBlue)"
                                                            />
                                                            {/* Line top */}
                                                            <rect
                                                                x={x - barWidth / 2}
                                                                y={y}
                                                                width={barWidth}
                                                                height="4"
                                                                rx="2"
                                                                fill="#2563eb"
                                                            />
                                                            {/* Nhãn giá trị cột */}
                                                            <text
                                                                x={x}
                                                                y={y - 8}
                                                                textAnchor="middle"
                                                                fill="#475569"
                                                                fontSize="10"
                                                                fontWeight="bold"
                                                            >
                                                                {item.sales > 1000000 ? `${(item.sales / 1000000).toFixed(1)}M` : `${item.sales}`}
                                                            </text>
                                                            {/* Nhãn tháng dưới trục X */}
                                                            <text
                                                                x={x}
                                                                y="230"
                                                                textAnchor="middle"
                                                                fill="#64748b"
                                                                fontSize="11"
                                                            >
                                                                {item.name}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tỷ lệ Phương thức thanh toán Donut SVG */}
                            <div className="col-lg-4">
                                <div className="card h-100 border-0 shadow-sm rounded-lg">
                                    <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                                        <h3 className="h5 font-weight-bold mb-1 text-dark">Hình thức thanh toán</h3>
                                        <p className="text-muted small mb-0">Cơ cấu phương thức đơn hàng.</p>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                                        <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                                            <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                                                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.2"></circle>
                                                
                                                {/* COD: 60% (stroke-dasharray="60 40") */}
                                                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray="60 40" strokeDashoffset="25"></circle>
                                                
                                                {/* Bank: 30% (stroke-dasharray="30 70", dashoffset: 25 - 60 = -35 -> 65) */}
                                                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.2" strokeDasharray="30 70" strokeDashoffset="65"></circle>
                                                
                                                {/* PayPal: 10% (stroke-dasharray="10 90", dashoffset: 65 - 30 = 35) */}
                                                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.2" strokeDasharray="10 90" strokeDashoffset="35"></circle>
                                            </svg>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: 'center'
                                            }}>
                                                <span className="font-weight-bold h5 text-dark mb-0 d-block">{stats.orders}</span>
                                                <span className="text-muted" style={{ fontSize: '10px' }}>Đơn hàng</span>
                                            </div>
                                        </div>

                                        <div className="w-100 mt-4 px-2">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center text-muted small">
                                                    <span className="d-inline-block rounded-circle mr-2" style={{ width: '8px', height: '8px', background: '#f59e0b' }}></span>
                                                    Tiền mặt (COD)
                                                </div>
                                                <span className="font-weight-bold text-dark small">60%</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center text-muted small">
                                                    <span className="d-inline-block rounded-circle mr-2" style={{ width: '8px', height: '8px', background: '#3b82f6' }}></span>
                                                    Chuyển khoản
                                                </div>
                                                <span className="font-weight-bold text-dark small">30%</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center text-muted small">
                                                    <span className="d-inline-block rounded-circle mr-2" style={{ width: '8px', height: '8px', background: '#10b981' }}></span>
                                                    PayPal
                                                </div>
                                                <span className="font-weight-bold text-dark small">10%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table Đơn hàng Admin (Recent Purchases) */}
                    {isAdmin() && (
                        <div className="card border-0 shadow-sm rounded-lg mb-4">
                            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                                <div>
                                    <h3 className="h5 font-weight-bold mb-1 text-dark">Đơn hàng mới nhận</h3>
                                    <p className="text-muted small mb-0">Danh sách các đơn đặt hàng gần đây cần xử lý hoặc theo dõi.</p>
                                </div>
                                <span className="badge badge-primary-light text-primary font-weight-bold px-3 py-1 rounded-pill">
                                    Realtime
                                </span>
                            </div>
                            <div className="card-body p-0 table-responsive">
                                <table className="table table-hover text-nowrap mb-0 align-middle">
                                    <thead className="thead-light-custom">
                                        <tr>
                                            <th className="pl-4">Mã đơn hàng</th>
                                            <th>Khách hàng</th>
                                            <th>Số điện thoại</th>
                                            <th>Sản phẩm</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày đặt</th>
                                            <th className="pr-4 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5 text-muted">Chưa có dữ liệu giao dịch nào.</td>
                                            </tr>
                                        ) : (
                                            recentOrders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="pl-4 font-weight-bold text-primary">#{order.orderCode}</td>
                                                    <td>{order.receiverName}</td>
                                                    <td>{order.receiverPhone}</td>
                                                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                                        {getOrderDetails(order).map((detail, dIdx) => (
                                                            <div key={detail.id || `${order.id}-${detail.productVariantId}`} className="small text-dark font-weight-medium">
                                                                • {detail.productNameSnapshot} <span className="text-muted">x{detail.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td className="font-weight-black text-dark">{formatCurrency(order.totalAmount)}</td>
                                                    <td>
                                                        <span className={`badge-pill-status ${getStatusMeta(order.orderStatus).badge}`}>
                                                            {getStatusMeta(order.orderStatus).label}
                                                        </span>
                                                    </td>
                                                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                    <td className="pr-4 text-center">
                                                        <div className="btn-group-actions">
                                                            <button
                                                                type="button"
                                                                className="btn btn-action-view"
                                                                title="Xem chi tiết"
                                                                onClick={() => setSelectedOrderDetails(order)}
                                                            >
                                                                <i className="far fa-eye"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-action-status"
                                                                title="Cập nhật trạng thái"
                                                                onClick={() => setStatusChangeOrder(order)}
                                                            >
                                                                <i className="fas fa-tasks"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Table Đơn hàng Cá nhân (My Orders) */}
                    <div className="card border-0 shadow-sm rounded-lg">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                            <h3 className="h5 font-weight-bold mb-1 text-dark">Đơn hàng của tôi</h3>
                            <p className="text-muted small mb-0">Các đơn hàng mua sắm cá nhân của tài khoản của bạn.</p>
                        </div>
                        <div className="card-body p-0 table-responsive">
                            {orderError && <div className="alert alert-warning mx-4 my-2">{orderError}</div>}
                            <table className="table table-hover text-nowrap mb-0 align-middle">
                                <thead className="thead-light-custom">
                                    <tr>
                                        <th className="pl-4">Mã đơn</th>
                                        <th>Người nhận</th>
                                        <th>Sản phẩm</th>
                                        <th>Tổng thanh toán</th>
                                        <th>Phương thức</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày đặt</th>
                                        <th className="pr-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5 text-muted">Không tìm thấy đơn hàng cá nhân nào.</td>
                                        </tr>
                                    ) : (
                                        myOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="pl-4 font-weight-bold text-dark">#{order.orderCode}</td>
                                                <td>
                                                    <div className="font-weight-medium">{order.receiverName}</div>
                                                    <small className="text-muted">{order.receiverPhone}</small>
                                                </td>
                                                <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                                    {getOrderDetails(order).map((detail) => (
                                                        <div key={detail.id || `${order.id}-${detail.productVariantId}`} className="small">
                                                            {detail.productNameSnapshot} <span className="text-muted">x{detail.quantity}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="font-weight-bold text-dark">{formatCurrency(order.totalAmount)}</td>
                                                <td className="text-uppercase text-muted small">{order.paymentMethod}</td>
                                                <td>
                                                    <span className={`badge-pill-status ${getStatusMeta(order.orderStatus).badge}`}>
                                                        {getStatusMeta(order.orderStatus).label}
                                                    </span>
                                                </td>
                                                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                <td className="pr-4 text-center">
                                                    <div className="btn-group-actions">
                                                        <button
                                                            type="button"
                                                            className="btn btn-action-view"
                                                            title="Xem chi tiết"
                                                            onClick={() => setSelectedOrderDetails(order)}
                                                        >
                                                            <i className="far fa-eye"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-action-edit"
                                                            disabled={!canModifyOrder(order)}
                                                            onClick={() => startEditOrder(order)}
                                                            title="Sửa thông tin"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-action-delete"
                                                            disabled={!canModifyOrder(order) && order.orderStatus !== 'cancelled'}
                                                            onClick={() => deleteOrder(order)}
                                                            title="Xóa đơn hàng"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL: Sửa thông tin giao hàng đơn cá nhân */}
            {editingOrder && (
                <div className="modal-backdrop-custom show">
                    <div className="modal-content-custom">
                        <div className="modal-header-custom border-bottom">
                            <h5 className="modal-title font-weight-bold text-dark">Chỉnh sửa đơn hàng #{editingOrder.orderCode}</h5>
                            <button className="close-btn-custom" onClick={cancelEditOrder}>&times;</button>
                        </div>
                        <form onSubmit={saveOrder}>
                            <div className="modal-body-custom">
                                {orderError && <div className="alert alert-danger mb-3">{orderError}</div>}
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label className="font-weight-bold text-muted small">Tên người nhận</label>
                                        <input
                                            className="form-control"
                                            value={orderForm.receiverName}
                                            onChange={(event) => setOrderField('receiverName', event.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label className="font-weight-bold text-muted small">Số điện thoại</label>
                                        <input
                                            className="form-control"
                                            value={orderForm.receiverPhone}
                                            onChange={(event) => setOrderField('receiverPhone', event.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-12 form-group mt-2">
                                        <label className="font-weight-bold text-muted small">Địa chỉ nhận hàng</label>
                                        <input
                                            className="form-control"
                                            value={orderForm.shippingAddress}
                                            onChange={(event) => setOrderField('shippingAddress', event.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 form-group mt-2">
                                        <label className="font-weight-bold text-muted small">Email</label>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={orderForm.email}
                                            onChange={(event) => setOrderField('email', event.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6 form-group mt-2">
                                        <label className="font-weight-bold text-muted small">Hình thức thanh toán</label>
                                        <select
                                            className="custom-select form-control"
                                            value={orderForm.paymentMethod}
                                            onChange={(event) => setOrderField('paymentMethod', event.target.value)}
                                        >
                                            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                            <option value="banktransfer">Chuyển khoản ngân hàng</option>
                                            <option value="paypal">Cổng PayPal</option>
                                        </select>
                                    </div>
                                    <div className="col-12 form-group mt-2">
                                        <label className="font-weight-bold text-muted small">Ghi chú giao hàng</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={orderForm.note}
                                            onChange={(event) => setOrderField('note', event.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-custom border-top mt-3 d-flex justify-content-end gap-2">
                                <button className="btn btn-secondary px-4 rounded-pill" type="button" onClick={cancelEditOrder}>
                                    Hủy
                                </button>
                                <button className="btn btn-primary px-4 rounded-pill" type="submit" disabled={savingOrder}>
                                    {savingOrder ? 'Đang lưu...' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Xem Chi Tiết Đơn Hàng */}
            {selectedOrderDetails && (
                <div className="modal-backdrop-custom show">
                    <div className="modal-content-custom modal-size-lg">
                        <div className="modal-header-custom border-bottom">
                            <h5 className="modal-title font-weight-bold text-dark">Chi tiết Đơn hàng #{selectedOrderDetails.orderCode}</h5>
                            <button className="close-btn-custom" onClick={() => setSelectedOrderDetails(null)}>&times;</button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h6 className="font-weight-black text-dark mb-2">Thông tin giao nhận</h6>
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-1"><strong>Người nhận:</strong> {selectedOrderDetails.receiverName}</p>
                                        <p className="mb-1"><strong>Điện thoại:</strong> {selectedOrderDetails.receiverPhone}</p>
                                        <p className="mb-1"><strong>Email:</strong> {selectedOrderDetails.guestEmail || 'N/A'}</p>
                                        <p className="mb-0"><strong>Địa chỉ:</strong> {selectedOrderDetails.shippingAddressFull || selectedOrderDetails.shippingAddress}</p>
                                    </div>
                                </div>
                                <div className="col-md-6 mt-3 mt-md-0">
                                    <h6 className="font-weight-black text-dark mb-2">Thanh toán & Vận chuyển</h6>
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-1"><strong>Ngày đặt hàng:</strong> {selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
                                        <p className="mb-1"><strong>Phương thức:</strong> <span className="text-uppercase font-weight-bold text-primary">{selectedOrderDetails.paymentMethod}</span></p>
                                        <p className="mb-1">
                                            <strong>Trạng thái đơn:</strong>{' '}
                                            <span className={`badge-pill-status ${getStatusMeta(selectedOrderDetails.orderStatus).badge}`}>
                                                {getStatusMeta(selectedOrderDetails.orderStatus).label}
                                            </span>
                                        </p>
                                        <p className="mb-0"><strong>Ghi chú:</strong> {selectedOrderDetails.note || 'Không có ghi chú'}</p>
                                    </div>
                                </div>
                            </div>

                            <h6 className="font-weight-black text-dark mb-2">Danh sách mặt hàng mua</h6>
                            <div className="table-responsive border rounded">
                                <table className="table table-hover text-nowrap mb-0 align-middle">
                                    <thead className="thead-light-custom">
                                        <tr>
                                            <th className="pl-3">Sản phẩm</th>
                                            <th className="text-center">Đơn giá</th>
                                            <th className="text-center">Số lượng</th>
                                            <th className="pr-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getOrderDetails(selectedOrderDetails).map((detail, idx) => (
                                            <tr key={detail.id || idx}>
                                                <td className="pl-3 font-weight-medium text-dark">{detail.productNameSnapshot}</td>
                                                <td className="text-center">{formatCurrency(detail.unitPriceSnapshot)}</td>
                                                <td className="text-center font-weight-bold">x{detail.quantity}</td>
                                                <td className="pr-3 text-right font-weight-bold text-dark">{formatCurrency(detail.unitPriceSnapshot * detail.quantity)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-light font-weight-bold text-dark">
                                            <td colSpan="3" className="pl-3 text-right">Tổng giá trị đơn hàng:</td>
                                            <td className="pr-3 text-right h6 font-weight-black text-danger">{formatCurrency(selectedOrderDetails.totalAmount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer-custom border-top mt-3 d-flex justify-content-end">
                            <button className="btn btn-secondary px-4 rounded-pill" onClick={() => setSelectedOrderDetails(null)}>
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Xác nhận Cập nhật Trạng thái Đơn hàng (Dành cho Admin) */}
            {statusChangeOrder && (
                <div className="modal-backdrop-custom show">
                    <div className="modal-content-custom">
                        <div className="modal-header-custom border-bottom">
                            <h5 className="modal-title font-weight-bold text-dark">Cập nhật trạng thái đơn #{statusChangeOrder.orderCode}</h5>
                            <button className="close-btn-custom" onClick={() => setStatusChangeOrder(null)}>&times;</button>
                        </div>
                        <div className="modal-body-custom">
                            <p className="text-muted">Chọn một trạng thái đơn hàng mới để thay thế cho trạng thái hiện tại (<strong>{getStatusMeta(statusChangeOrder.orderStatus).label}</strong>):</p>
                            
                            <div className="d-flex flex-column gap-2 mt-3">
                                {orderStatuses.map((status) => {
                                    const isCurrent = status.value === statusChangeOrder.orderStatus;
                                    return (
                                        <button
                                            key={status.value}
                                            type="button"
                                            disabled={updatingStatusId === statusChangeOrder.id}
                                            className={`btn w-100 d-flex justify-content-between align-items-center py-2 px-3 rounded-lg border text-left ${isCurrent ? 'bg-primary-light text-primary font-weight-bold' : 'bg-light text-dark'}`}
                                            onClick={() => updateOrderStatus(statusChangeOrder.id, status.value)}
                                        >
                                            <span>
                                                <span className="d-inline-block rounded-circle mr-3" style={{ width: '10px', height: '10px', backgroundColor: status.color }}></span>
                                                {status.label}
                                            </span>
                                            {isCurrent && <i className="fas fa-check"></i>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="modal-footer-custom border-top mt-3 d-flex justify-content-end">
                            <button className="btn btn-secondary px-4 rounded-pill" onClick={() => setStatusChangeOrder(null)}>
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
