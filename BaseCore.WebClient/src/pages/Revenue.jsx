import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const orderStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

const emptySummary = {
    totalOrders: 0,
    validOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    byStatus: {},
};

const Revenue = () => {
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(emptySummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        loadOrders();
    }, [keyword, statusFilter, page]);

    // Trang doanh thu tái sử dụng API tìm kiếm đơn và summary đã tính ở backend.
    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await orderApi.getAll({
                keyword,
                status: statusFilter,
                page,
                pageSize,
            });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : Array.isArray(response.data)
                    ? response.data
                    : [];

            if (!Array.isArray(response.data?.items) && !Array.isArray(response.data)) {
                setOrders([]);
                setSummary(emptySummary);
                setError('Orders API did not return a valid list. Check that ApiGateway and APIService are running.');
                return;
            }

            setOrders(items);
            setSummary(response.data?.summary || emptySummary);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Failed to load revenue:', error);
            setOrders([]);
            setSummary(emptySummary);
            setError(error.response?.data?.message || 'Failed to load revenue. Check that ApiGateway and APIService are running.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => orderStatuses.find((item) => item.value === status)?.label || status || 'Pending';

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

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
                            <div className="card">
                                <div className="card-header">
                                    <div className="row align-items-center">
                                        <div className="col-lg-8">
                                            <form className="form-inline" onSubmit={(event) => event.preventDefault()}>
                                                <input
                                                    type="search"
                                                    className="form-control mr-2 mb-2 mb-sm-0"
                                                    placeholder="Search order, customer, phone, payment"
                                                    value={keyword}
                                                    onChange={(event) => {
                                                        setKeyword(event.target.value);
                                                        setPage(1);
                                                    }}
                                                />
                                                <select
                                                    className="custom-select mr-2 mb-2 mb-sm-0"
                                                    value={statusFilter}
                                                    onChange={(event) => {
                                                        setStatusFilter(event.target.value);
                                                        setPage(1);
                                                    }}
                                                >
                                                    <option value="">All Statuses</option>
                                                    {orderStatuses.map((status) => (
                                                        <option key={status.value} value={status.value}>{status.label}</option>
                                                    ))}
                                                </select>
                                                {(keyword || statusFilter) && (
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => {
                                                            setKeyword('');
                                                            setStatusFilter('');
                                                            setPage(1);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </form>
                                        </div>
                                        <div className="col-lg-4 text-lg-right mt-2 mt-lg-0">
                                            <span className="text-muted">
                                                Showing {orders.length} of {totalCount} orders
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-3 col-6">
                                    <div className="small-box bg-primary">
                                        <div className="inner">
                                            <h3 style={{ fontSize: '1.6rem' }}>{formatCurrency(summary.totalRevenue)}</h3>
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
                                            <h3 style={{ fontSize: '1.6rem' }}>{formatCurrency(summary.todayRevenue)}</h3>
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
                                            <h3>{summary.totalOrders}</h3>
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
                                            <h3>{summary.validOrders}</h3>
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
                                            {Object.keys(summary.byStatus || {}).length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="text-center py-4">No revenue data</td>
                                                </tr>
                                            ) : (
                                                Object.entries(summary.byStatus).map(([status, count]) => (
                                                    <tr key={status}>
                                                        <td>{getStatusLabel(status)}</td>
                                                        <td>{count}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Revenue Orders</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    <table className="table table-hover text-nowrap mb-0">
                                        <thead>
                                            <tr>
                                                <th>Order Code</th>
                                                <th>Customer</th>
                                                <th>Phone</th>
                                                <th>Total</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-4">
                                                        {(keyword || statusFilter) ? 'No revenue orders match your search' : 'No revenue data'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>{order.orderCode}</td>
                                                        <td>{order.receiverName}</td>
                                                        <td>{order.receiverPhone}</td>
                                                        <td>{formatCurrency(order.totalAmount)}</td>
                                                        <td>{order.paymentMethod}</td>
                                                        <td>{getStatusLabel(order.orderStatus)}</td>
                                                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center p-3">
                                        <span>Total: {totalCount} orders</span>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(Math.max(1, page - 1))}>
                                                        Previous
                                                    </button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(page + 1)}>
                                                        Next
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
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
