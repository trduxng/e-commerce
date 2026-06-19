import React, { useEffect, useState } from 'react';
import { orderApi } from '../services/api';
import { formatCurrency } from '../data/shopData';
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

const orderStatuses = [
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'return_requested', label: 'Yêu cầu trả hàng' },
    { value: 'returned', label: 'Đã trả hàng' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
    { value: 'return_rejected', label: 'Từ chối trả hàng' },
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

    const exportToExcel = () => {
        if (orders.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        const data = orders.map(o => ({
            'ID': o.id,
            'Mã đơn': o.orderCode || o.id,
            'Khách hàng': o.receiverName,
            'SĐT': o.receiverPhone,
            'Tổng tiền': o.totalAmount,
            'Trạng thái': getStatusLabel(o.orderStatus),
            'Thanh toán': o.paymentMethod || '',
            'Ngày tạo': o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''
        }));
        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'DoanhThu');
        writeFile(workbook, 'Bao_cao_doanh_thu.xlsx');
    };

    const exportToXml = () => {
        if (orders.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        let xml = '<?xml version="1.0" encoding="UTF-8"?><Revenues>\n';
        orders.forEach(o => {
            xml += `  <Order>\n`;
            xml += `    <Id>${o.id}</Id>\n`;
            xml += `    <OrderCode>${o.orderCode || o.id}</OrderCode>\n`;
            xml += `    <ReceiverName>${o.receiverName}</ReceiverName>\n`;
            xml += `    <TotalAmount>${o.totalAmount}</TotalAmount>\n`;
            xml += `    <OrderStatus>${o.orderStatus}</OrderStatus>\n`;
            xml += `  </Order>\n`;
        });
        xml += '</Revenues>';
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Bao_cao_doanh_thu.xml';
        a.click();
    };



    const renderPagination = () => {
        return (
            <li className="page-item disabled">
                <span className="page-link text-dark">Trang {page} / {totalPages || 1}</span>
            </li>
        );
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Báo cáo Doanh thu</h1>
                        </div>
                        <div className="col-sm-6 text-right">
                            <div className="btn-group">
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
                                                    placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
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
                                                        Xóa
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
                                            <p>Tổng số đơn</p>
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
                                            <p>Đơn tính doanh thu</p>
                                        </div>
                                        <div className="icon">
                                            <i className="fas fa-receipt"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Đơn hàng theo trạng thái</h3>
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
