import React, { useEffect, useMemo, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const Revenue = () => {
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
            console.error('Failed to load revenue:', error);
            setOrders([]);
            setError(error.response?.data?.message || 'Failed to load revenue. Check that ApiGateway and APIService are running.');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const today = new Date().toLocaleDateString('vi-VN');
        const deliveredOrders = orders.filter((order) => order.orderStatus !== 'cancelled');
        const todayOrders = deliveredOrders.filter((order) =>
            order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') === today : false
        );

        const byStatus = orders.reduce((result, order) => {
            const status = order.orderStatus || 'pending';
            result[status] = (result[status] || 0) + 1;
            return result;
        }, {});

        return {
            totalOrders: orders.length,
            validOrders: deliveredOrders.length,
            totalRevenue: deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
            todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
            byStatus,
        };
    }, [orders]);

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Revenue</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-warning">{error}</div>}
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="row">
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-primary">
                                        <div className="inner">
                                            <h3 style={{ fontSize: '1.6rem' }}>{formatCurrency(stats.totalRevenue)}</h3>
                                            <p>Total Revenue</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-coins"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-success">
                                        <div className="inner">
                                            <h3 style={{ fontSize: '1.6rem' }}>{formatCurrency(stats.todayRevenue)}</h3>
                                            <p>Today Revenue</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-calendar-day"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-info">
                                        <div className="inner">
                                            <h3>{stats.totalOrders}</h3>
                                            <p>Total Orders</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-shopping-cart"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-warning">
                                        <div className="inner">
                                            <h3>{stats.validOrders}</h3>
                                            <p>Revenue Orders</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Orders By Status</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    <table className="table table-bordered mb-0">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Orders</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(stats.byStatus).length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" className="text-center py-4">No revenue data</td>
                                                </tr>
                                            ) : (
                                                Object.entries(stats.byStatus).map(([status, count]) => (
                                                    <tr key={status}>
                                                        <td>{status}</td>
                                                        <td>{count}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Revenue;
