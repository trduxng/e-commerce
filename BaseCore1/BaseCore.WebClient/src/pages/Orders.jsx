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

    const getOrderDetails = (order) => order.orderDetails || order.details || [];

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Orders</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Purchase Orders</h3>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">No orders found</td>
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
                                                        <span className="badge badge-info">{order.orderStatus}</span>
                                                    </td>
                                                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
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
