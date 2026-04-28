import React, { useState, useEffect } from 'react';
import { productApi, userApi, categoryApi, orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../data/shopData';

const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        users: 0,
        orders: 0,
        revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
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
                                    <a href="/products" className="small-box-footer">
                                        More info <i className="fas fa-arrow-circle-right"></i>
                                    </a>
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
                                    <a href="/categories" className="small-box-footer">
                                        More info <i className="fas fa-arrow-circle-right"></i>
                                    </a>
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
                                        <a href="/users" className="small-box-footer">
                                            More info <i className="fas fa-arrow-circle-right"></i>
                                        </a>
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
                                                                <span className="badge badge-info">{order.orderStatus}</span>
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
