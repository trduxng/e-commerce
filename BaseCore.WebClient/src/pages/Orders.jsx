import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const orderStatuses = [
    { value: 'pending', label: 'Pending', badge: 'badge-warning' },
    { value: 'confirmed', label: 'Confirmed', badge: 'badge-primary' },
    { value: 'shipping', label: 'Shipping', badge: 'badge-info' },
    { value: 'delivered', label: 'Delivered', badge: 'badge-success' },
    { value: 'cancelled', label: 'Cancelled', badge: 'badge-secondary' },
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [keyword, statusFilter, page]);

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
                setError('Orders API did not return a valid list. Check that ApiGateway and APIService are running.');
                return;
            }

            setOrders(items);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Failed to load orders:', error);
            setOrders([]);
            setError(error.response?.data?.message || 'Failed to load orders. Check that ApiGateway and APIService are running.');
        } finally {
            setLoading(false);
        }
    };

    const getOrderDetails = (order) => order.orderDetails || order.details || [];
    const getStatusMeta = (status) => orderStatuses.find((item) => item.value === status) || orderStatuses[0];
    const getDetailImage = (detail) => detail.productImageUrl || detail.productVariant?.imageUrl || '/img/product-1.jpg';

    const updateStatus = async (order, status) => {
        if (status === order.orderStatus) return;

        setUpdatingOrderId(order.id);
        setError('');

        try {
            const response = await orderApi.updateStatus(order.id, status);
            const updatedOrder = response.data;
            setOrders((current) => current.map((item) => (
                Number(item.id) === Number(order.id)
                    ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
                    : item
            )));
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update order status.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

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
                            <h1 className="m-0">Orders</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <form className="form-inline" onSubmit={(event) => event.preventDefault()}>
                                        <input
                                            type="search"
                                            className="form-control mr-2 mb-2 mb-sm-0"
                                            placeholder="Search code, customer, phone, product"
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
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-warning m-3">{error}</div>}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <>
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
                                                    <td colSpan={8} className="text-center py-4">
                                                        {(keyword || statusFilter) ? 'No orders match your search' : 'No orders found'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>{order.orderCode}</td>
                                                        <td>{order.receiverName}</td>
                                                        <td>{order.receiverPhone}</td>
                                                        <td>
                                                            {getOrderDetails(order).map((detail) => (
                                                                <div key={detail.id || `${order.id}-${detail.productVariantId}`} className="admin-order-product">
                                                                    <img src={getDetailImage(detail)} alt={detail.productNameSnapshot} />
                                                                    <div>
                                                                        <div className="font-weight-bold">{detail.productNameSnapshot}</div>
                                                                        <small className="text-muted">
                                                                            Qty {detail.quantity}
                                                                            {detail.colorSnapshot ? ` - ${detail.colorSnapshot}` : ''}
                                                                            {detail.sizeSnapshot ? ` - ${detail.sizeSnapshot}` : ''}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>{formatCurrency(order.totalAmount)}</td>
                                                        <td>{order.paymentMethod}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <span className={`badge mr-2 ${getStatusMeta(order.orderStatus).badge}`}>
                                                                    {getStatusMeta(order.orderStatus).label}
                                                                </span>
                                                                <select
                                                                    className="custom-select custom-select-sm order-status-select"
                                                                    value={order.orderStatus}
                                                                    disabled={updatingOrderId === order.id}
                                                                    onChange={(event) => updateStatus(order, event.target.value)}
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Orders;
