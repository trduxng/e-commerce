import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await orderApi.getAll();
            if (!Array.isArray(response.data)) {
                setOrders([]);
                setError('Orders API did not return a valid list. Check that ApiGateway and APIService are running.');
                return;
            }

            setOrders(response.data);
        } catch (error) {
            console.error('Failed to load orders:', error);
            setOrders([]);
            setError(error.response?.data?.message || 'Failed to load orders. Check that ApiGateway and APIService are running.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (!window.confirm(`Change order status to ${newStatus}?`)) return;

        try {
            await orderApi.update(orderId, { status: newStatus });
            loadOrders();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update order status');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'badge-warning';
            case 'confirmed': return 'badge-primary';
            case 'shipping': return 'badge-info';
            case 'completed': case 'delivered': return 'badge-success';
            case 'cancelled': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    const getOrderDetails = (order) => order.orderDetails || order.details || [];

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Orders Management</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Resolve Bills</h3>
                        </div>
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-warning m-3">{error}</div>}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <table className="table table-hover text-nowrap mb-0">
                                    <thead>
                                        <tr>
                                            <th>Order Code</th>
                                            <th>Customer</th>
                                            <th>Phone</th>
                                            <th>Products</th>
                                            <th>Total</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">No orders found</td>
                                            </tr>
                                        ) : (
                                            orders.map((order) => (
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
                                                    <td>{order.paymentMethod}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>{order.orderStatus}</span>
                                                    </td>
                                                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                    <td>
                                                        <select 
                                                            className="form-control form-control-sm"
                                                            value={order.orderStatus}
                                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirmed</option>
                                                            <option value="shipping">Shipping</option>
                                                            <option value="completed">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Orders;
