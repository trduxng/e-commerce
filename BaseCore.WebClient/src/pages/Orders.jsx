import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';
import { Link } from 'react-router-dom';

const orderStatuses = [
    { value: 'pending', label: 'Chờ duyệt', badge: 'badge-warning' },
    { value: 'confirmed', label: 'Đã xác nhận', badge: 'badge-primary' },
    { value: 'shipping', label: 'Đang giao', badge: 'badge-info' },
    { value: 'delivered', label: 'Đã giao', badge: 'badge-success' },
    { value: 'cancelled', label: 'Đã hủy', badge: 'badge-secondary' },
    { value: 'return_requested', label: 'Yêu cầu trả hàng', badge: 'badge-info' },
    { value: 'returned', label: 'Đã trả hàng', badge: 'badge-dark' },
    { value: 'refunded', label: 'Đã hoàn tiền', badge: 'badge-danger' },
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Search states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderStatusIds, setOrderStatusIds] = useState('');
    const [paymentStatusIds, setPaymentStatusIds] = useState('');
    const [shippingStatusIds, setShippingStatusIds] = useState('');
    const [billingEmail, setBillingEmail] = useState('');
    const [billingPhone, setBillingPhone] = useState('');
    const [billingLastName, setBillingLastName] = useState('');
    const [goDirectlyToCustomOrderNumber, setGoDirectlyToCustomOrderNumber] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [sortField, setSortField] = useState('created');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Order detail modal states
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const getOrderDetails = (order) => order?.orderDetails || order?.details || [];
    const getDetailImage = (detail) => (
        detail.productImageUrl
        || detail.productVariant?.imageUrl
        || detail.productVariant?.product?.imageUrl
        || "/img/product-1.jpg"
    );
    const getProductId = (detail) => detail.productId || detail.productVariant?.productId || detail.productVariant?.product?.id;
    const normalizeStatus = (status) => {
        const value = String(status || "pending").trim().toLowerCase();
        if (value === "cancel" || value === "canceled") return "cancelled";
        if (value === "completed") return "delivered";
        return value;
    };
    const getStatus = (status) => {
        const statuses = {
            pending: { label: "Chờ duyệt", className: "badge-warning" },
            confirmed: { label: "Đã xác nhận", className: "badge-primary" },
            shipping: { label: "Đang giao", className: "badge-info" },
            delivered: { label: "Đã giao", className: "badge-success" },
            cancelled: { label: "Đã hủy", className: "badge-secondary" },
            return_requested: { label: "Yêu cầu trả", className: "badge-info" },
            returned: { label: "Đã trả", className: "badge-dark" },
            refunded: { label: "Đã hoàn tiền", className: "badge-danger" },
        };
        return statuses[normalizeStatus(status)] || statuses.pending;
    };
    const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "");

    const closeOrderDetail = () => {
        setSelectedOrder(null);
    };

    const loadOrderDetail = async (order) => {
        setSelectedOrder(order);
        setDetailLoading(true);
        setError("");

        try {
            const response = await orderApi.getById(order.id);
            const orderData = response.data?.order || response.data;
            const details = response.data?.details || orderData?.orderDetails || getOrderDetails(order);
            setSelectedOrder({ ...order, ...orderData, orderDetails: details });
        } catch (error) {
            setError(error.response?.data?.message || "Không thể tải chi tiết đơn hàng.");
        } finally {
            setDetailLoading(false);
        }
    };


    useEffect(() => {
        loadOrders();
    }, [page, pageSize, sortField, sortDir]);

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await orderApi.getAll({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: orderStatusIds || undefined,
                paymentStatus: paymentStatusIds || undefined,
                shippingStatus: shippingStatusIds || undefined,
                billingEmail: billingEmail || undefined,
                billingLastName: billingLastName || undefined,
                billingPhone: billingPhone || undefined,
                orderCode: goDirectlyToCustomOrderNumber || undefined,
                sortField,
                sortDir,
                page,
                pageSize,
            });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : Array.isArray(response.data)
                    ? response.data
                    : [];

            setOrders(items);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Lỗi khi tải đơn hàng:', error);
            setOrders([]);
            setError(error.response?.data?.message || 'Không thể tải danh sách đơn hàng. Kiểm tra kết nối.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        if (page === 1) {
            loadOrders();
        } else {
            setPage(1);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(orders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const getStatusMeta = (status) => orderStatuses.find((item) => item.value === status) || orderStatuses[0];

    const updateStatus = async (order, status) => {
        if (status === order.orderStatus) return;

        setUpdatingOrderId(order.id);
        setError('');

        try {
            const response = await orderApi.updateStatus(order.id, status);
            const updatedOrder = response.data;
            setOrders((current) => current.map((item) => (
                Number(item.id) === Number(order.id)
                    ? { ...item, ...updatedOrder }
                    : item
            )));
        } catch (error) {
            setError(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`paginate_button page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <div className="content-wrapper">
            <div className="content-header clearfix">
                <h1 className="float-left">
                    Đơn hàng
                </h1>
                <div className="float-right">
                    <div className="btn-group">
                        <button type="button" className="btn btn-success">
                            <i className="fas fa-download"></i> Xuất file
                        </button>
                        <button type="button" className="btn btn-success dropdown-toggle dropdown-icon" data-toggle="dropdown" aria-expanded="false">
                            <span className="sr-only">&nbsp;</span>
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    <i className="far fa-file-code"></i> Xuất ra XML (tất cả)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Xuất XML Đã chọn: ' + selectedIds.join(','))}>
                                    <i className="far fa-file-code"></i> Xuất ra XML (đã chọn)
                                </button>
                            </li>
                            <li className="dropdown-divider"></li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    <i className="far fa-file-excel"></i> Xuất ra Excel (tất cả)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Xuất Excel Đã chọn: ' + selectedIds.join(','))}>
                                    <i className="far fa-file-excel"></i> Xuất ra Excel (đã chọn)
                                </button>
                            </li>
                        </ul>
                    </div>
                    {' '}
                    <button type="button" name="importexcel" className="btn bg-olive" data-toggle="modal" data-target="#importexcel-window">
                        <i className="fas fa-upload"></i> Nhập file
                    </button>
                    {' '}
                    <div className="btn-group">
                        <button type="button" className="btn btn-info">
                            <i className="far fa-file-pdf"></i> In phiếu giao hàng
                        </button>
                        <button type="button" className="btn btn-info dropdown-toggle dropdown-icon" data-toggle="dropdown" aria-expanded="false">
                            <span className="sr-only">&nbsp;</span>
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    In phiếu giao hàng (tất cả)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Print pdf: ' + selectedIds.join(','))}>
                                    In phiếu giao hàng (đã chọn)
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="form-horizontal">
                        <div className="cards-group">
                            <div className="card card-default card-search">
                                <div className="card-body">
                                    <div className={`row search-row ${isSearchOpen ? 'opened' : ''}`} onClick={() => setIsSearchOpen(!isSearchOpen)} style={{ cursor: 'pointer' }}>
                                        <div className="search-text">Tìm kiếm</div>
                                        <div className="icon-search"><i className="fas fa-search" aria-hidden="true"></i></div>
                                        <div className="icon-collapse"><i className={`fas fa-angle-${isSearchOpen ? 'up' : 'down'}`} aria-hidden="true"></i></div>
                                    </div>

                                    <div className={`search-body ${isSearchOpen ? '' : 'closed'}`} style={{ display: isSearchOpen ? 'block' : 'none' }}>
                                        <div className="row">
                                            <div className="col-md-5">
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label" title="Start date for the search.">Từ ngày</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label" title="End date for the search.">Đến ngày</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Trạng thái đơn hàng</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={orderStatusIds} onChange={e => setOrderStatusIds(e.target.value)}>
                                                            <option value="">Tất cả</option>
                                                            {orderStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Trạng thái thanh toán</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={paymentStatusIds} onChange={e => setPaymentStatusIds(e.target.value)}>
                                                            <option value="">Tất cả</option>
                                                            <option value="pending">Chờ thanh toán</option>
                                                            <option value="paid">Đã thanh toán</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Trạng thái giao hàng</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={shippingStatusIds} onChange={e => setShippingStatusIds(e.target.value)}>
                                                            <option value="">Tất cả</option>
                                                            <option value="not_yet_shipped">Chưa giao</option>
                                                            <option value="shipped">Đang giao</option>
                                                            <option value="delivered">Đã giao</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-7">
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Email thanh toán</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Tên người nhận</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingLastName} onChange={e => setBillingLastName(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">SĐT người nhận</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Đi tới đơn hàng #</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <div className="input-group input-group-short">
                                                            <input type="text" className="form-control" value={goDirectlyToCustomOrderNumber} onChange={e => setGoDirectlyToCustomOrderNumber(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(e); }} />
                                                            <span className="input-group-append">
                                                                <button type="button" className="btn btn-info btn-flat" disabled={loading} onClick={handleSearch}>Đi</button>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Sắp xếp theo</label></div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortField} onChange={e => setSortField(e.target.value)}>
                                                            <option value="created">Ngày tạo</option>
                                                            <option value="total">Tổng tiền</option>
                                                            <option value="ordercode">Mã đơn hàng</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortDir} onChange={e => setSortDir(e.target.value)}>
                                                            <option value="desc">Giảm dần</option>
                                                            <option value="asc">Tăng dần</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="text-center col-12">
                                                <button type="button" id="search-orders" className="btn btn-primary btn-search" disabled={loading} onClick={handleSearch}>
                                                    {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                    Tìm kiếm
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card card-default">
                                <div className="card-body">
                                    {error && <div className="alert alert-warning alert-dismissible"><button type="button" className="close" data-dismiss="alert" aria-hidden="true">×</button>{error}</div>}
                                    
                                    <div className="dataTables_wrapper dt-bootstrap4 no-footer">
                                        <div className="row">
                                            <div className="col-sm-12 col-md-6">
                                                <div className="dataTables_length">
                                                    <label>
                                                        Hiển thị 
                                                        <select className="custom-select custom-select-sm form-control form-control-sm" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                                            <option value="7">7</option>
                                                            <option value="15">15</option>
                                                            <option value="20">20</option>
                                                            <option value="50">50</option>
                                                            <option value="100">100</option>
                                                        </select>
                                                         mục
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-12">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-hover table-striped dataTable no-footer">
                                                        <thead>
                                                            <tr role="row">
                                                                <th className="text-center sorting_disabled" style={{ width: '50px' }}>
                                                                    <input type="checkbox" className="mastercheckbox" 
                                                                           checked={orders.length > 0 && selectedIds.length === orders.length} 
                                                                           onChange={handleSelectAll} />
                                                                </th>
                                                                <th className="sorting" style={{ width: '80px' }}>Mã đơn</th>
                                                                <th className="sorting" style={{ width: '100px' }}>Trạng thái ĐH</th>
                                                                <th className="sorting" style={{ width: '150px' }}>Trạng thái TT</th>
                                                                <th className="sorting" style={{ width: '150px' }}>Giao hàng</th>
                                                                <th className="sorting">Khách hàng</th>
                                                                <th className="sorting" style={{ width: '120px' }}>Ngày tạo</th>
                                                                <th className="sorting" style={{ width: '100px' }}>Tổng tiền</th>
                                                                <th className="text-center sorting_disabled" style={{ width: '50px' }}>Xem</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {loading ? (
                                                                <tr><td colSpan="9" className="text-center dataTables_empty">Đang tải...</td></tr>
                                                            ) : orders.length === 0 ? (
                                                                <tr><td colSpan="9" className="text-center dataTables_empty">Không có dữ liệu</td></tr>
                                                            ) : (
                                                                orders.map(order => (
                                                                    <tr key={order.id} role="row" className="odd">
                                                                        <td className="text-center">
                                                                            <input type="checkbox" className="checkboxGroups" 
                                                                                   value={order.id} 
                                                                                   checked={selectedIds.includes(order.id)} 
                                                                                   onChange={() => handleSelectRow(order.id)} />
                                                                        </td>
                                                                        <td>{order.orderCode || order.id}</td>
                                                                        <td>
                                                                            <div className="d-flex align-items-center">
                                                                                <span className={`grid-report-item mr-2 ${getStatusMeta(order.orderStatus).badge.replace('badge-', 'text-')}`}>
                                                                                    {getStatusMeta(order.orderStatus).label}
                                                                                </span>
                                                                                <select
                                                                                    className="custom-select custom-select-sm order-status-select"
                                                                                    value={order.orderStatus || 'pending'}
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
                                                                        <td>{order.paymentMethod || 'Pending'}</td>
                                                                        <td>{order.orderStatus === 'shipping' || order.orderStatus === 'delivered' ? 'Đã giao' : 'Chưa giao'}</td>
                                                                        <td>
                                                                            {order.receiverName} <br/>
                                                                            <Link to={`/admin/customers/edit/${order.userId || 0}`}>{order.receiverEmail || order.receiverPhone}</Link>
                                                                        </td>
                                                                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB') : ''}</td>
                                                                        <td>{formatCurrency(order.totalAmount)}</td>
                                                                        <td className="text-center button-column">
                                                                            <button className="btn btn-default" type="button" onClick={() => loadOrderDetail(order)}>
                                                                                <i className="fas fa-eye"></i> Xem
                                                                            </button>

                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-12 col-md-5">
                                                <div className="dataTables_info" role="status" aria-live="polite">
                                                    {totalCount > 0 
                                                        ? `Hiển thị ${((page - 1) * pageSize) + 1} đến ${Math.min(page * pageSize, totalCount)} trong tổng số ${totalCount} mục`
                                                        : 'Không có dữ liệu'}
                                                </div>
                                            </div>
                                            <div className="col-sm-12 col-md-7">
                                                <div className="dataTables_paginate paging_simple_numbers">
                                                    <ul className="pagination">
                                                        <li className={`paginate_button page-item previous ${page === 1 ? 'disabled' : ''}`}>
                                                            <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                                                        </li>
                                                        {renderPagination()}
                                                        <li className={`paginate_button page-item next ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                                            <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal xem chi tiết đơn hàng cho Admin */}
            {selectedOrder && (
                <>
                    <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Chi tiết đơn hàng {selectedOrder.orderCode || selectedOrder.id}</h5>
                                    <button type="button" className="close" onClick={closeOrderDetail} aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {detailLoading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Đang tải...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <h6><strong>Thông tin giao nhận</strong></h6>
                                                    <table className="table table-sm table-borderless">
                                                        <tbody>
                                                            <tr><td><strong>Người nhận:</strong></td><td>{selectedOrder.receiverName}</td></tr>
                                                            <tr><td><strong>Số điện thoại:</strong></td><td>{selectedOrder.receiverPhone}</td></tr>
                                                            <tr><td><strong>Email:</strong></td><td>{selectedOrder.receiverEmail || selectedOrder.guestEmail || 'N/A'}</td></tr>
                                                            <tr><td><strong>Địa chỉ:</strong></td><td>{selectedOrder.shippingAddressFull || selectedOrder.receiverAddress || 'N/A'}</td></tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6><strong>Thông tin đơn hàng</strong></h6>
                                                    <table className="table table-sm table-borderless">
                                                        <tbody>
                                                            <tr><td><strong>Ngày tạo:</strong></td><td>{formatDate(selectedOrder.createdAt)}</td></tr>
                                                            <tr><td><strong>Trạng thái:</strong></td><td>
                                                                <span className={`badge ${getStatus(selectedOrder.orderStatus).className}`}>
                                                                    {getStatus(selectedOrder.orderStatus).label}
                                                                </span>
                                                            </td></tr>
                                                            <tr><td><strong>Thanh toán:</strong></td><td>{selectedOrder.paymentMethod}</td></tr>
                                                            <tr><td><strong>Trạng thái TT:</strong></td><td>
                                                                <span className={`badge ${selectedOrder.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                                    {selectedOrder.paymentStatus || 'pending'}
                                                                </span>
                                                            </td></tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {selectedOrder.note && (
                                                <div className="alert alert-info">
                                                    <strong>Ghi chú:</strong> {selectedOrder.note}
                                                </div>
                                            )}

                                            <h6><strong>Danh sách sản phẩm ({getOrderDetails(selectedOrder).length})</strong></h6>
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-striped table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '60px' }}>Hình ảnh</th>
                                                            <th>Sản phẩm</th>
                                                            <th>Sku</th>
                                                            <th>Đơn giá</th>
                                                            <th style={{ width: '80px' }}>Số lượng</th>
                                                            <th style={{ width: '120px' }}>Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getOrderDetails(selectedOrder).map((detail) => (
                                                            <tr key={detail.id || detail.productVariantId}>
                                                                <td className="text-center">
                                                                    <img 
                                                                        src={getDetailImage(detail)} 
                                                                        alt={detail.productNameSnapshot} 
                                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div>{detail.productNameSnapshot}</div>
                                                                    {detail.colorSnapshot || detail.sizeSnapshot ? (
                                                                        <small className="text-muted">
                                                                            Phân loại: {[detail.colorSnapshot, detail.sizeSnapshot].filter(Boolean).join(' - ')}
                                                                        </small>
                                                                    ) : null}
                                                                </td>
                                                                <td><code>{detail.skuSnapshot || 'N/A'}</code></td>
                                                                <td>{formatCurrency(detail.unitPrice)}</td>
                                                                <td className="text-center">{detail.quantity}</td>
                                                                <td>{formatCurrency(detail.totalPrice || (detail.unitPrice * detail.quantity))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="row justify-content-end">
                                                <div className="col-md-5">
                                                    <table className="table table-sm table-borderless">
                                                        <tbody>
                                                            <tr>
                                                                <td>Tạm tính:</td>
                                                                <td className="text-right">{formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td>Phí vận chuyển:</td>
                                                                <td className="text-right">{formatCurrency(selectedOrder.shippingFee || 0)}</td>
                                                            </tr>
                                                            {selectedOrder.discountAmount > 0 && (
                                                                <tr>
                                                                    <td>Giảm giá:</td>
                                                                    <td className="text-right text-danger">-{formatCurrency(selectedOrder.discountAmount)}</td>
                                                                </tr>
                                                            )}
                                                            <tr className="border-top">
                                                                <td><strong>Tổng cộng:</strong></td>
                                                                <td className="text-right"><strong>{formatCurrency(selectedOrder.totalAmount)}</strong></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeOrderDetail}>Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                </>
            )}
        </div>
    );
};


export default Orders;
