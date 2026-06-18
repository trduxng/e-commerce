import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const orderStatuses = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao hàng' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'cancelled', label: 'Đã hủy' },
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
                setError('Lỗi kết nối API lấy danh sách đơn hàng. Vui lòng kiểm tra lại hệ thống.');
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
            setError(error.response?.data?.message || 'Tải dữ liệu doanh thu thất bại. Vui lòng kiểm tra lại hệ thống.');
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
                            <h1 className="m-0">Doanh thu</h1>
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
                                                    placeholder="Tìm mã đơn, khách, SĐT..."
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
                                                    <option value="">Tất cả trạng thái</option>
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
                                                        Xóa lọc
                                                    </button>
                                                )}
                                            </form>
                                        </div>
                                        <div className="col-lg-4 text-lg-right mt-2 mt-lg-0">
                                            <span className="text-muted">
                                                Hiển thị {orders.length} / {totalCount} đơn hàng
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
                                            <p>Tổng doanh thu</p>
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
                                            <p>Doanh thu hôm nay</p>
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
                                            <p>Tổng số đơn hàng</p>
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
                                            <p>Đơn hàng có doanh thu</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Thống kê trạng thái</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    <table className="table table-bordered mb-0">
                                        <thead>
                                            <tr>
                                                <th>Trạng thái</th>
                                                <th>Số lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(summary.byStatus || {}).length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="text-center py-4">Không có dữ liệu</td>
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
                                    <h3 className="card-title">Danh sách đơn hàng</h3>
                                </div>
                                <div className="card-body table-responsive p-0">
                                    <table className="table table-hover text-nowrap mb-0">
                                        <thead>
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>SĐT</th>
                                                <th>Tổng tiền</th>
                                                <th>Thanh toán</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-4">
                                                        {(keyword || statusFilter) ? 'Không tìm thấy đơn hàng phù hợp' : 'Không có dữ liệu'}
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
                                        <span>Tổng: {totalCount} đơn hàng</span>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(Math.max(1, page - 1))}>
                                                        Trước
                                                    </button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                                    <button className="page-link" type="button" onClick={() => setPage(page + 1)}>
                                                        Sau
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
