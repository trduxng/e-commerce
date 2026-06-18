import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';
import { Link } from 'react-router-dom';

const orderStatuses = [
    { value: 'pending', label: 'Pending', badge: 'badge-warning' },
    { value: 'confirmed', label: 'Confirmed', badge: 'badge-primary' },
    { value: 'shipping', label: 'Shipping', badge: 'badge-info' },
    { value: 'delivered', label: 'Delivered', badge: 'badge-success' },
    { value: 'cancelled', label: 'Cancelled', badge: 'badge-secondary' },
    { value: 'return_requested', label: 'Return Requested', badge: 'badge-info' },
    { value: 'returned', label: 'Returned', badge: 'badge-dark' },
    { value: 'refunded', label: 'Refunded', badge: 'badge-danger' },
    { value: 'return_rejected', label: 'Return Rejected', badge: 'badge-secondary' },
];

const editableOrderStatuses = orderStatuses.filter((status) => (
    !['return_requested', 'returned', 'refunded', 'return_rejected'].includes(status.value)
));

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

    useEffect(() => {
        loadOrders();
    }, [page, pageSize, sortField, sortDir]);

    // Backend trả cả danh sách phân trang và summary doanh thu theo bộ lọc hiện tại.
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
            console.error('Failed to load orders:', error);
            setOrders([]);
            setError(error.response?.data?.message || 'Failed to load orders. Check that ApiGateway and APIService are running.');
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

    // Cập nhật trạng thái tại server rồi thay đúng dòng trong state để tránh tải lại toàn bảng.
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
            setError(error.response?.data?.message || 'Failed to update order status.');
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
                    Orders
                </h1>
                <div className="float-right">
                    <div className="btn-group">
                        <button type="button" className="btn btn-success">
                            <i className="fas fa-download"></i> Export
                        </button>
                        <button type="button" className="btn btn-success dropdown-toggle dropdown-icon" data-toggle="dropdown" aria-expanded="false">
                            <span className="sr-only">&nbsp;</span>
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    <i className="far fa-file-code"></i> Export to XML (all)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Export XML Selected: ' + selectedIds.join(','))}>
                                    <i className="far fa-file-code"></i> Export to XML (selected)
                                </button>
                            </li>
                            <li className="dropdown-divider"></li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    <i className="far fa-file-excel"></i> Export to Excel (all)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Export Excel Selected: ' + selectedIds.join(','))}>
                                    <i className="far fa-file-excel"></i> Export to Excel (selected)
                                </button>
                            </li>
                        </ul>
                    </div>
                    {' '}
                    <button type="button" name="importexcel" className="btn bg-olive" data-toggle="modal" data-target="#importexcel-window">
                        <i className="fas fa-upload"></i> Import
                    </button>
                    {' '}
                    <div className="btn-group">
                        <button type="button" className="btn btn-info">
                            <i className="far fa-file-pdf"></i> Print packaging slips
                        </button>
                        <button type="button" className="btn btn-info dropdown-toggle dropdown-icon" data-toggle="dropdown" aria-expanded="false">
                            <span className="sr-only">&nbsp;</span>
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none">
                                    Print packaging slips (all)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={() => alert('Print pdf: ' + selectedIds.join(','))}>
                                    Print packaging slips (selected)
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
                                        <div className="search-text">Search</div>
                                        <div className="icon-search"><i className="fas fa-search" aria-hidden="true"></i></div>
                                        <div className="icon-collapse"><i className={`fas fa-angle-${isSearchOpen ? 'up' : 'down'}`} aria-hidden="true"></i></div>
                                    </div>

                                    <div className={`search-body ${isSearchOpen ? '' : 'closed'}`} style={{ display: isSearchOpen ? 'block' : 'none' }}>
                                        <div className="row">
                                            <div className="col-md-5">
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label" title="Start date for the search.">Start date</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label" title="End date for the search.">End date</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Order statuses</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={orderStatusIds} onChange={e => setOrderStatusIds(e.target.value)}>
                                                            <option value="">All</option>
                                                            {orderStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Payment statuses</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={paymentStatusIds} onChange={e => setPaymentStatusIds(e.target.value)}>
                                                            <option value="">All</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Shipping statuses</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={shippingStatusIds} onChange={e => setShippingStatusIds(e.target.value)}>
                                                            <option value="">All</option>
                                                            <option value="not_yet_shipped">Not yet shipped</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="delivered">Delivered</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-7">
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Billing email address</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Billing last name</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingLastName} onChange={e => setBillingLastName(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Billing phone number</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Go directly to order #</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <div className="input-group input-group-short">
                                                            <input type="text" className="form-control" value={goDirectlyToCustomOrderNumber} onChange={e => setGoDirectlyToCustomOrderNumber(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(e); }} />
                                                            <span className="input-group-append">
                                                                <button type="button" className="btn btn-info btn-flat" disabled={loading} onClick={handleSearch}>Go</button>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Sort by</label></div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortField} onChange={e => setSortField(e.target.value)}>
                                                            <option value="created">Created date</option>
                                                            <option value="total">Order total</option>
                                                            <option value="ordercode">Order #</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortDir} onChange={e => setSortDir(e.target.value)}>
                                                            <option value="desc">Descending</option>
                                                            <option value="asc">Ascending</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="text-center col-12">
                                                <button type="button" id="search-orders" className="btn btn-primary btn-search" disabled={loading} onClick={handleSearch}>
                                                    {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                    Search
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
                                                        Show 
                                                        <select className="custom-select custom-select-sm form-control form-control-sm" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                                            <option value="7">7</option>
                                                            <option value="15">15</option>
                                                            <option value="20">20</option>
                                                            <option value="50">50</option>
                                                            <option value="100">100</option>
                                                        </select>
                                                         entries
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
                                                                <th className="sorting" style={{ width: '80px' }}>Order #</th>
                                                                <th className="sorting" style={{ width: '100px' }}>Order status</th>
                                                                <th className="sorting" style={{ width: '150px' }}>Payment status</th>
                                                                <th className="sorting" style={{ width: '150px' }}>Shipping status</th>
                                                                <th className="sorting">Customer</th>
                                                                <th className="sorting" style={{ width: '120px' }}>Created on</th>
                                                                <th className="sorting" style={{ width: '100px' }}>Order total</th>
                                                                <th className="text-center sorting_disabled" style={{ width: '50px' }}>View</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {loading ? (
                                                                <tr><td colSpan="9" className="text-center dataTables_empty">Loading...</td></tr>
                                                            ) : orders.length === 0 ? (
                                                                <tr><td colSpan="9" className="text-center dataTables_empty">No data available in table</td></tr>
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
                                                                                    disabled={
                                                                                        updatingOrderId === order.id
                                                                                        || !editableOrderStatuses.some((status) => status.value === order.orderStatus)
                                                                                    }
                                                                                    onChange={(event) => updateStatus(order, event.target.value)}
                                                                                >
                                                                                    {(editableOrderStatuses.some((status) => status.value === order.orderStatus)
                                                                                        ? editableOrderStatuses
                                                                                        : orderStatuses.filter((status) => status.value === order.orderStatus)
                                                                                    ).map((status) => (
                                                                                        <option key={status.value} value={status.value}>
                                                                                            {status.label}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        </td>
                                                                        <td>{order.paymentMethod || 'Pending'}</td>
                                                                        <td>{order.orderStatus === 'shipping' || order.orderStatus === 'delivered' ? 'Shipped' : 'Not yet shipped'}</td>
                                                                        <td>
                                                                            {order.receiverName} <br/>
                                                                            <Link to={`/admin/customers/edit/${order.userId || 0}`}>{order.receiverEmail || order.receiverPhone}</Link>
                                                                        </td>
                                                                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB') : ''}</td>
                                                                        <td>{formatCurrency(order.totalAmount)}</td>
                                                                        <td className="text-center button-column">
                                                                            <Link className="btn btn-default" to={`/admin/orders/edit/${order.id}`}>
                                                                                <i className="fas fa-eye"></i> View
                                                                            </Link>
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
                                                        ? `Showing ${((page - 1) * pageSize) + 1} to ${Math.min(page * pageSize, totalCount)} of ${totalCount} entries`
                                                        : 'Showing 0 to 0 of 0 entries'}
                                                </div>
                                            </div>
                                            <div className="col-sm-12 col-md-7">
                                                <div className="dataTables_paginate paging_simple_numbers">
                                                    <ul className="pagination">
                                                        <li className={`paginate_button page-item previous ${page === 1 ? 'disabled' : ''}`}>
                                                            <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                                                        </li>
                                                        {renderPagination()}
                                                        <li className={`paginate_button page-item next ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                                            <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
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
        </div>
    );
};

export default Orders;
