import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency, getApiErrorMessage } from '../data/shopData';
import { utils, writeFile } from 'xlsx';


const removeVietnameseTones = (str) => {
    if (!str) return "";
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    return str;
};

const returnStatuses = {
    return_requested: { label: 'Chờ xử lý', className: 'badge-info' },
    refunded: { label: 'Đã hoàn tiền', className: 'badge-danger' },
    return_rejected: { label: 'Đã từ chối', className: 'badge-secondary' },
};

const exportToExcel = () => {
        const exportData = categories.map(c => ({
            'ID': c.id,
            'Tên danh mục': c.name,
            'Mô tả': c.description || ''
        }));
        
        const worksheet = utils.json_to_sheet(exportData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Categories");
        writeFile(workbook, "categories_export.xlsx");
    };

const CurrentCarts = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [status, setStatus] = useState('return_requested');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [billingEmail, setBillingEmail] = useState('');
    const [billingPhone, setBillingPhone] = useState('');
    const [goDirectlyToCustomOrderNumber, setGoDirectlyToCustomOrderNumber] = useState('');

    useEffect(() => {
        loadReturnRequests();
    }, [page, pageSize, status]);

    const loadReturnRequests = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await orderApi.getAll({
                status,
                page,
                pageSize,
                search: searchTerm,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                billingEmail: billingEmail || undefined,
                billingPhone: billingPhone || undefined,
                orderCode: goDirectlyToCustomOrderNumber || undefined,
                sortField: 'updated',
                sortDir: 'desc',
            });
            const items = Array.isArray(response.data?.items) ? response.data.items : [];
            setOrders(items);
            setTotalCount(Number(response.data?.totalCount) || 0);
        } catch (requestError) {
            console.error(requestError);
            setOrders([]);
            setTotalCount(0);
            setError(getApiErrorMessage(requestError, 'Không thể tải danh sách yêu cầu trả hàng.'));
        } finally {
            setLoading(false);
        }
    };

    const processReturn = async (order, decision) => {
        const isApprove = decision === 'approve';
        const confirmation = isApprove
            ? `Duyệt trả hàng cho ${order.orderCode}? Hệ thống sẽ hoàn ${formatCurrency(order.totalAmount)} và cộng lại toàn bộ số lượng vào kho.`
            : `Từ chối yêu cầu trả hàng của đơn ${order.orderCode}?`;

        if (!window.confirm(confirmation)) return;

        setProcessingId(order.id);
        setError('');
        setSuccess('');

        try {
            const response = await orderApi.processReturn(order.id, decision);
            if (isApprove) {
                setSuccess(
                    `Đã hoàn ${formatCurrency(response.data?.refundedAmount || order.totalAmount)}`
                    + ` và cộng lại ${response.data?.restoredItemCount || 0} sản phẩm vào kho.`
                );
            } else {
                setSuccess(`Đã từ chối yêu cầu trả hàng của đơn ${order.orderCode}.`);
            }
            await loadReturnRequests();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Không thể xử lý yêu cầu trả hàng.'));
        } finally {
            setProcessingId(null);
        }
    };

    const getOrderDetails = (order) => order.orderDetails || order.details || [];
    const totalPages = Math.ceil(totalCount / pageSize);

    const getStatusLabel = (s) => returnStatuses[s]?.label || s;

    const exportToExcel = () => {
        if (orders.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        const data = orders.map(o => ({
            'ID': o.id,
            'Mã đơn': o.orderCode || o.id,
            'Người nhận': o.receiverName,
            'SĐT': o.receiverPhone,
            'Tổng tiền': o.totalAmount,
            'Trạng thái': getStatusLabel(o.orderStatus),
            'Ngày tạo': o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''
        }));
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Returns');
        writeFile(workbook, 'Danh_sach_quan_ly_tra_hang.xlsx');
    };

    const exportToXml = () => {
        if (orders.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        let xml = '<?xml version="1.0" encoding="UTF-8"?><Returns>\n';
        orders.forEach(o => {
            xml += `  <Return>\n`;
            xml += `    <Id>${o.id}</Id>\n`;
            xml += `    <OrderCode>${o.orderCode || o.id}</OrderCode>\n`;
            xml += `    <ReceiverName>${o.receiverName}</ReceiverName>\n`;
            xml += `    <TotalAmount>${o.totalAmount}</TotalAmount>\n`;
            xml += `    <OrderStatus>${getStatusLabel(o.orderStatus)}</OrderStatus>\n`;
            xml += `  </Return>\n`;
        });
        xml += '</Returns>';
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Danh_sach_quan_ly_tra_hang.xml';
        a.click();
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="m-0">Quản lý trả hàng</h1>
                        <div className="text-muted mt-1">
                            Duyệt hoàn tiền và khôi phục tồn kho cho đơn khách yêu cầu trả.
                        </div>
                    </div>
                    <div>
                        <div className="btn-group mr-2">
                            <button type="button" className="btn btn-success" onClick={exportToExcel}>
                                <i className="fas fa-download"></i> Xuất file
                            </button>
                            <button type="button" className="btn btn-success dropdown-toggle dropdown-icon" data-toggle="dropdown" aria-expanded="false">
                                <span className="sr-only">&nbsp;</span>
                            </button>
                            <ul className="dropdown-menu" role="menu">
                                <li className="dropdown-item">
                                    <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={exportToXml}>
                                        <i className="far fa-file-code"></i> Xuất XML
                                    </button>
                                </li>
                                <li className="dropdown-item">
                                    <button type="button" className="btn btn-link text-left w-100 p-0 text-dark text-decoration-none" onClick={exportToExcel}>
                                        <i className="far fa-file-excel"></i> Xuất Excel
                                    </button>
                                </li>

                            </ul>
                        </div>
                        <button className="btn btn-outline-primary" type="button" onClick={loadReturnRequests}>
                            <i className="fas fa-sync-alt mr-2"></i>Làm mới
                        </button>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

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
                                                        <div className="label-wrapper"><label className="col-form-label">Từ ngày</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <div className="label-wrapper"><label className="col-form-label">Đến ngày</label></div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                                                            <input type="text" className="form-control" value={goDirectlyToCustomOrderNumber} onChange={e => setGoDirectlyToCustomOrderNumber(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadReturnRequests(); } }} />
                                                            <span className="input-group-append">
                                                                <button type="button" className="btn btn-info btn-flat" disabled={loading} onClick={() => { setPage(1); loadReturnRequests(); }}>Đi</button>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="text-center col-12">
                                                <button type="button" className="btn btn-primary btn-search" disabled={loading} onClick={() => { setPage(1); loadReturnRequests(); }}>
                                                    {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                    Tìm kiếm
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header d-flex flex-wrap align-items-center">
                            <div className="btn-group btn-group-sm">
                                {Object.entries(returnStatuses).map(([value, meta]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`btn ${status === value ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => {
                                            setStatus(value);
                                            setPage(1);
                                            setSuccess('');
                                        }}
                                    >
                                        {meta.label}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto d-flex align-items-center">
                                <input
                                    type="text"
                                    className="form-control form-control-sm mr-3"
                                    placeholder="Tìm nhanh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadReturnRequests(); } }}
                                    style={{ width: '200px' }}
                                />
                                <button className="btn btn-sm btn-outline-secondary mr-3" onClick={() => { setPage(1); loadReturnRequests(); }}>
                                    <i className="fas fa-search"></i>
                                </button>
                                <span className="text-muted mr-2">Hiển thị</span>
                                <select
                                    className="form-control form-control-sm"
                                    value={pageSize}
                                    onChange={(event) => {
                                        setPageSize(Number(event.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>

                        <div className="card-body table-responsive p-0">
                            <table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Đơn hàng</th>
                                        <th>Khách hàng</th>
                                        <th>Sản phẩm trả</th>
                                        <th>Số tiền</th>
                                        <th>Thanh toán</th>
                                        <th>Trạng thái</th>
                                        <th className="text-right">Xử lý</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">Đang tải...</td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                Không có yêu cầu trả hàng ở trạng thái này.
                                            </td>
                                        </tr>
                                    ) : orders.map((order) => {
                                        const statusMeta = returnStatuses[order.orderStatus] || returnStatuses.return_requested;
                                        const details = getOrderDetails(order);
                                        return (
                                            <tr key={order.id}>
                                                <td>
                                                    <strong>{order.orderCode}</strong>
                                                    <div className="small text-muted">
                                                        {order.updatedAt ? new Date(order.updatedAt).toLocaleString('vi-VN') : ''}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong>{order.receiverName}</strong>
                                                    <div className="small text-muted">{order.guestEmail || order.receiverPhone}</div>
                                                </td>
                                                <td style={{ minWidth: 260 }}>
                                                    <ul className="list-unstyled mb-0 small">
                                                        {details.map((detail) => {
                                                            const options = [detail.sizeSnapshot, detail.colorSnapshot]
                                                                .filter(Boolean)
                                                                .join(' / ');
                                                            return (
                                                                <li key={detail.id} className="mb-1">
                                                                    {detail.productNameSnapshot}
                                                                    {options ? ` (${options})` : ''} × {detail.quantity}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </td>
                                                <td>
                                                    <strong>{formatCurrency(order.totalAmount)}</strong>
                                                </td>
                                                <td>
                                                    <div>{order.paymentMethod || '-'}</div>
                                                    <span className="small text-muted">{order.paymentStatus || 'pending'}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${statusMeta.className}`}>{statusMeta.label}</span>
                                                </td>
                                                <td className="text-right" style={{ minWidth: 190 }}>
                                                    {order.orderStatus === 'return_requested' ? (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success mr-2"
                                                                type="button"
                                                                disabled={processingId === order.id}
                                                                onClick={() => processReturn(order, 'approve')}
                                                            >
                                                                <i className="fas fa-check mr-1"></i>
                                                                Duyệt & hoàn tiền
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                type="button"
                                                                disabled={processingId === order.id}
                                                                onClick={() => processReturn(order, 'reject')}
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted small">Đã xử lý</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <span className="text-muted">{totalCount} yêu cầu</span>
                            {totalPages > 1 && (
                                <ul className="pagination pagination-sm m-0">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        >
                                            Trước
                                        </button>
                                    </li>
                                    <li className="page-item disabled">
                                        <span className="page-link">{page} / {totalPages}</span>
                                    </li>
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            type="button"
                                            disabled={page === totalPages}
                                            onClick={() => setPage((current) => current + 1)}
                                        >
                                            Sau
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CurrentCarts;
