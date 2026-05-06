import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, userApi, categoryApi, orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../data/shopData';

const orderStatuses = [
    { value: 'pending', label: 'Pending', badge: 'badge-warning' },
    { value: 'confirmed', label: 'Confirmed', badge: 'badge-primary' },
    { value: 'shipping', label: 'Shipping', badge: 'badge-info' },
    { value: 'delivered', label: 'Delivered', badge: 'badge-success' },
    { value: 'cancelled', label: 'Cancelled', badge: 'badge-secondary' },
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
                setOrderError('Cannot load your orders.');
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
                    console.log('Cannot fetch admin stats');
                }
            }

            setStats((current) => ({
                ...current,
                products: getTotalCount(productsRes.data),
                categories: getTotalCount(categoriesRes.data),
                users: usersCount,
            }));
        } catch (error) {
            console.error('Failed to load stats:', error);
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
            setOrderError(error.response?.data?.message || 'Failed to update order.');
        } finally {
            setSavingOrder(false);
        }
    };

    const deleteOrder = async (order) => {
        if (!window.confirm(`Delete order ${order.orderCode}?`)) return;

        setOrderError('');
        try {
            await orderApi.delete(order.id);
            setMyOrders((current) => current.filter((item) => Number(item.id) !== Number(order.id)));
            setRecentOrders((current) => current.filter((item) => Number(item.id) !== Number(order.id)));
            if (editingOrder?.id === order.id) setEditingOrder(null);
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Failed to delete order.');
        }
    };

    const updateOrderStatus = async (order, status) => {
        if (status === order.orderStatus) return;

        setUpdatingStatusId(order.id);
        setOrderError('');

        try {
            const response = await orderApi.updateStatus(order.id, status);
            const updatedOrder = response.data;
            setRecentOrders((current) => current.map((item) => (
                Number(item.id) === Number(order.id)
                    ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
                    : item
            )));
            setMyOrders((current) => current.map((item) => (
                Number(item.id) === Number(order.id)
                    ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
                    : item
            )));
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Failed to update order status.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Dashboard</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="row">
                            <div className="col-lg-3 col-6">
                                <div className="small-box bg-info">
                                    <div className="inner">
                                        <h3>{stats.products}</h3>
                                        <p>Products</p>
                                    </div>
                                    <div className="icon">
                                        <i className="fas fa-box"></i>
                                    </div>
                                    <Link to="/admin/products" className="small-box-footer">
                                        More info <i className="fas fa-arrow-circle-right"></i>
                                    </Link>
                                </div>
                            </div>
                            <div className="col-lg-3 col-6">
                                <div className="small-box bg-success">
                                    <div className="inner">
                                        <h3>{stats.categories}</h3>
                                        <p>Categories</p>
                                    </div>
                                    <div className="icon">
                                        <i className="fas fa-tags"></i>
                                    </div>
                                    <Link to="/admin/categories" className="small-box-footer">
                                        More info <i className="fas fa-arrow-circle-right"></i>
                                    </Link>
                                </div>
                            </div>
                            {isAdmin() && (
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-warning">
                                        <div className="inner">
                                            <h3>{stats.users}</h3>
                                            <p>Users</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <Link to="/admin/users" className="small-box-footer">
                                            More info <i className="fas fa-arrow-circle-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {isAdmin() && (
                                <>
                                    <div className="col-lg-3 col-6">
                                        <div className="small-box bg-danger">
                                            <div className="inner">
                                                <h3>{stats.orders}</h3>
                                                <p>Orders</p>
                                            </div>
                                            <div className="icon">
                                                <i className="fas fa-shopping-cart"></i>
                                            </div>
                                            <span className="small-box-footer">Stored purchases</span>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-6">
                                        <div className="small-box bg-primary">
                                            <div className="inner">
                                                <h3 style={{ fontSize: '1.6rem' }}>{formatCurrency(stats.revenue)}</h3>
                                                <p>Revenue</p>
                                            </div>
                                            <div className="icon">
                                                <i className="fas fa-coins"></i>
                                            </div>
                                            <span className="small-box-footer">Total order value</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {isAdmin() && (
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Recent Purchases</h3>
                                    </div>
                                    <div className="card-body table-responsive p-0">
                                        <table className="table table-hover text-nowrap mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Order Code</th>
                                                    <th>Customer</th>
                                                    <th>Phone</th>
                                                    <th>Products</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="text-center py-4">No purchase data yet.</td>
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
                                    <h3 className="card-title">My Orders</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    {orderError && <div className="alert alert-warning m-3">{orderError}</div>}
                                    <table className="table table-hover text-nowrap mb-0">
                                        <thead>
                                            <tr>
                                                <th>Order Code</th>
                                                <th>Receiver</th>
                                                <th>Products</th>
                                                <th>Total</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4">No orders found</td>
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
                                        <h5 className="mb-3">Edit {editingOrder.orderCode}</h5>
                                        <div className="row">
                                            <div className="col-md-4 form-group">
                                                <label>Receiver Name</label>
                                                <input
                                                    className="form-control"
                                                    value={orderForm.receiverName}
                                                    onChange={(event) => setOrderField('receiverName', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 form-group">
                                                <label>Phone</label>
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
                                                <label>Shipping Address</label>
                                                <input
                                                    className="form-control"
                                                    value={orderForm.shippingAddress}
                                                    onChange={(event) => setOrderField('shippingAddress', event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 form-group">
                                                <label>Payment</label>
                                                <select
                                                    className="custom-select"
                                                    value={orderForm.paymentMethod}
                                                    onChange={(event) => setOrderField('paymentMethod', event.target.value)}
                                                >
                                                    <option value="cod">Cash on Delivery</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="momo">MoMo Wallet</option>
                                                </select>
                                            </div>
                                            <div className="col-12 form-group">
                                                <label>Note</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={orderForm.note}
                                                    onChange={(event) => setOrderField('note', event.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary mr-2" type="submit" disabled={savingOrder}>
                                            {savingOrder ? 'Saving...' : 'Save Order'}
                                        </button>
                                        <button className="btn btn-secondary" type="button" onClick={cancelEditOrder}>
                                            Cancel
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Welcome to BaseCore Sales System</h3>
                                </div>
                                <div className="card-body">
                                    <p>This is a teaching framework for web development using:</p>
                                    <ul>
                                        <li><strong>Backend:</strong> .NET Core 8.0 with Entity Framework Core</li>
                                        <li><strong>Frontend:</strong> React 18 with React Router</li>
                                        <li><strong>UI:</strong> AdminLTE 3 with Bootstrap 4</li>
                                        <li><strong>Authentication:</strong> JWT Bearer Token</li>
                                    </ul>
                                    <p>Features include:</p>
                                    <ul>
                                        <li>User Authentication (Login/Logout)</li>
                                        <li>Product Management (CRUD with Search & Pagination)</li>
                                        <li>Category Management</li>
                                        <li>User Management (Admin only)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
