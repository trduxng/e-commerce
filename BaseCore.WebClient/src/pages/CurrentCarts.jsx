import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency, getApiErrorMessage } from '../data/shopData';

const returnStatuses = {
    return_requested: { label: 'Chờ xử lý', className: 'badge-info' },
    refunded: { label: 'Đã hoàn tiền', className: 'badge-danger' },
    return_rejected: { label: 'Đã từ chối', className: 'badge-secondary' },
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
                    <button className="btn btn-outline-primary" type="button" onClick={loadReturnRequests}>
                        <i className="fas fa-sync-alt mr-2"></i>Làm mới
                    </button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

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
