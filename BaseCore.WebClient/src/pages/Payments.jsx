import React, { useState, useEffect } from 'react';
import { paymentApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const statusBadgeClass = {
    Paid: 'badge-success',
    Pending: 'badge-warning',
    Failed: 'badge-danger',
    Refunded: 'badge-secondary'
};

const Payments = () => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [transactions, setTransactions] = useState([]);
    const [gateways, setGateways] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [reconFile, setReconFile] = useState(null);
    const [reconResult, setReconResult] = useState(null);
    const [reconLoading, setReconLoading] = useState(false);
    const [editingGateway, setEditingGateway] = useState(null);
    const [gatewayForm, setGatewayForm] = useState({
        active: false,
        environment: 'Sandbox',
        clientId: '',
        clientSecret: '',
        merchantId: ''
    });
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txRes, gatewayRes] = await Promise.all([
                paymentApi.getAllTransactions(),
                paymentApi.getGateways()
            ]);
            setTransactions(txRes.data);
            setGateways(gatewayRes.data);
        } catch (error) {
            console.error('Failed to load payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTxStatus = async (id, status) => {
        try {
            await paymentApi.updateTransactionStatus(id, status);
            const updated = transactions.map(t => t.id === id ? { ...t, status } : t);
            setTransactions(updated);
            if (selectedTx && selectedTx.id === id) {
                setSelectedTx({ ...selectedTx, status });
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleEditGateway = (gw) => {
        setEditingGateway(gw);
        setGatewayForm({
            active: gw.active,
            environment: gw.environment,
            clientId: gw.clientId || '',
            clientSecret: gw.clientSecret || '',
            merchantId: gw.merchantId || ''
        });
        setShowKey(false);
    };

    const handleSaveGateway = async (e) => {
        e.preventDefault();
        try {
            await paymentApi.updateGateway(editingGateway.id, gatewayForm);
            setGateways(gateways.map(g => g.id === editingGateway.id ? { ...g, ...gatewayForm } : g));
            setEditingGateway(null);
        } catch (error) {
            alert('Failed to save gateway config');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReconFile(file);
        }
    };

    const runReconciliation = () => {
        if (!reconFile) return;
        setReconLoading(true);
        
        // Simulating parsing and reconciliation calculations
        setTimeout(() => {
            // Match mock transactions against "uploaded statement"
            const processed = transactions.map(tx => {
                let status = 'matched';
                let reason = 'Khớp hoàn toàn';
                if (tx.id === 1004) {
                    status = 'mismatch';
                    reason = 'Không tìm thấy giao dịch trên sao kê ngân hàng';
                } else if (tx.id === 1002 && tx.status === 'Pending') {
                    status = 'mismatch';
                    reason = 'Giao dịch chưa hoàn tất thanh toán trên hệ thống';
                }
                return { ...tx, reconStatus: status, reconReason: reason };
            });

            setReconResult({
                totalSystem: transactions.length,
                matched: processed.filter(p => p.reconStatus === 'matched').length,
                unmatched: processed.filter(p => p.reconStatus === 'mismatch').length,
                details: processed
            });
            setReconLoading(false);
        }, 1500);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
        const matchesSearch = tx.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (tx.reference && tx.reference.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const netRevenue = transactions
        .filter(t => t.status === 'Paid')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingSettlements = transactions
        .filter(t => t.status === 'Pending')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunded = transactions
        .filter(t => t.status === 'Refunded')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1 font-weight-bold text-dark">Quản lý Thanh toán</h1>
                    <p className="text-muted small">Giám sát dòng tiền, cấu hình cổng thanh toán và đối soát số dư tự động.</p>
                </div>
            </div>

            {/* KPI Cards Overview */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4 d-flex align-items-center">
                            <div className="bento-icon-wrapper bg-success-light text-success me-3" style={{ flexShrink: 0 }}>
                                <i className="fas fa-wallet"></i>
                            </div>
                            <div>
                                <span className="text-muted small font-weight-bold uppercase-label d-block mb-1">Doanh thu thực nhận (Net)</span>
                                <h3 className="h4 font-weight-bold mb-0 text-success">{formatCurrency(netRevenue)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4 d-flex align-items-center">
                            <div className="bento-icon-wrapper bg-warning-light text-warning me-3" style={{ flexShrink: 0 }}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div>
                                <span className="text-muted small font-weight-bold uppercase-label d-block mb-1">Đang chờ xử lý</span>
                                <h3 className="h4 font-weight-bold mb-0 text-warning">{formatCurrency(pendingSettlements)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4 d-flex align-items-center">
                            <div className="bento-icon-wrapper bg-danger-light text-danger me-3" style={{ flexShrink: 0 }}>
                                <i className="fas fa-undo"></i>
                            </div>
                            <div>
                                <span className="text-muted small font-weight-bold uppercase-label d-block mb-1">Đã hoàn tiền</span>
                                <h3 className="h4 font-weight-bold mb-0 text-danger">{formatCurrency(totalRefunded)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div className="nav nav-pills bg-white p-1 rounded-3 shadow-sm border">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`nav-link border-0 px-4 py-2 font-weight-bold ${activeTab === 'transactions' ? 'active bg-dark text-white' : 'text-secondary bg-transparent'}`}
                    >
                        Giao dịch thanh toán
                    </button>
                    <button
                        onClick={() => setActiveTab('gateways')}
                        className={`nav-link border-0 px-4 py-2 font-weight-bold ${activeTab === 'gateways' ? 'active bg-dark text-white' : 'text-secondary bg-transparent'}`}
                    >
                        Cấu hình Cổng
                    </button>
                    <button
                        onClick={() => setActiveTab('reconciliation')}
                        className={`nav-link border-0 px-4 py-2 font-weight-bold ${activeTab === 'reconciliation' ? 'active bg-dark text-white' : 'text-secondary bg-transparent'}`}
                    >
                        Đối soát tài chính
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            {loading ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-dark" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    {/* TAB 1: TRANSACTIONS */}
                    {activeTab === 'transactions' && (
                        <div>
                            {/* Search & Filter Header */}
                            <div className="p-4 border-b bg-light/50 d-flex flex-col flex-md-row justify-content-between align-items-stretch gap-3">
                                <div className="position-relative flex-grow-1">
                                    <i className="fas fa-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}></i>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo Mã đơn, tên Khách, Reference ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-control shadow-none"
                                        style={{ paddingLeft: '38px', borderRadius: '10px' }}
                                    />
                                </div>
                                <div className="d-flex gap-2">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="form-select shadow-none"
                                        style={{ minWidth: '180px', borderRadius: '10px' }}
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="Paid">Đã thanh toán (Paid)</option>
                                        <option value="Pending">Chờ thanh toán (Pending)</option>
                                        <option value="Failed">Thanh toán lỗi (Failed)</option>
                                        <option value="Refunded">Đã hoàn tiền (Refunded)</option>
                                    </select>
                                    <button onClick={loadData} className="btn btn-outline-secondary" style={{ borderRadius: '10px' }}>
                                        <i className="fas fa-sync-alt"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="thead-light-custom">
                                        <tr>
                                            <th className="px-4 py-3">Giao dịch</th>
                                            <th className="px-4 py-3">Khách hàng</th>
                                            <th className="px-4 py-3">Phương thức</th>
                                            <th className="px-4 py-3">Số tiền</th>
                                            <th className="px-4 py-3">Gateway Reference</th>
                                            <th className="px-4 py-3">Trạng thái</th>
                                            <th className="px-4 py-3 text-end">Ngày tạo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5 text-muted">Không tìm thấy giao dịch nào.</td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map((tx) => (
                                                <tr
                                                    key={tx.id}
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="cursor-pointer"
                                                    style={{ transition: 'background-color 0.15s ease' }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-weight-bold text-dark">TX-{tx.id}</div>
                                                        <div className="text-muted small mt-0.5">{tx.orderCode}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-dark">{tx.customerName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="badge badge-primary-light font-weight-bold px-2 py-1 rounded">
                                                            {tx.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-weight-bold text-dark">
                                                        {formatCurrency(tx.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-muted small">{tx.reference}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`badge-pill-status ${statusBadgeClass[tx.status]}`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-end text-muted small">
                                                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: GATEWAYS */}
                    {activeTab === 'gateways' && (
                        <div className="p-4">
                            <h2 className="h5 font-weight-bold text-dark mb-4">Danh sách Cổng thanh toán</h2>
                            <div className="row g-4">
                                {gateways.map((gw) => (
                                    <div key={gw.id} className="col-12 col-md-6 col-lg-4">
                                        <div className="card h-100 border rounded-4 shadow-sm" style={{ transition: 'transform 0.2s ease' }}>
                                            <div className="card-body p-4 d-flex flex-column justify-content-between gap-4">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-gradient-revenue text-white font-weight-bold d-flex align-items-center justify-content-center me-3" style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, fontSize: '0.9rem' }}>
                                                            {gw.id.toUpperCase().substring(0, 3)}
                                                        </div>
                                                        <div>
                                                            <h3 className="h6 font-weight-bold mb-0 text-dark">{gw.name}</h3>
                                                            <span className="text-muted small">Môi trường: <strong className="text-dark">{gw.environment}</strong></span>
                                                        </div>
                                                    </div>
                                                    <span className={`badge-pill-status ${gw.active ? 'badge-success' : 'badge-secondary'}`}>
                                                        {gw.active ? 'Bật' : 'Tắt'}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-end border-top pt-3">
                                                    <button
                                                        onClick={() => handleEditGateway(gw)}
                                                        className="btn btn-outline-dark btn-sm px-3 rounded-3 font-weight-bold"
                                                    >
                                                        <i className="fas fa-cog mr-1"></i> Cấu hình API
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: RECONCILIATION */}
                    {activeTab === 'reconciliation' && (
                        <div className="p-4">
                            <h2 className="h5 font-weight-bold text-dark mb-2">Đối soát dòng tiền tự động</h2>
                            <p className="text-muted small mb-4">Tải lên file sao kê CSV/Excel từ cổng thanh toán để tự động đối chiếu số dư, doanh thu và phí với hệ thống.</p>
                            
                            <div className="row g-4">
                                <div className="col-12 col-lg-6">
                                    <div 
                                        className="reconciliation-upload-box mb-4" 
                                        onClick={() => document.getElementById('recon-file-input').click()}
                                    >
                                        <i className="fas fa-file-csv text-dark fa-2x"></i>
                                        <span className="font-weight-bold text-dark">Tải lên sao kê của bạn</span>
                                        <p className="text-muted small">Kéo thả hoặc nhấn để chọn file .csv hoặc .xlsx</p>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={handleFileUpload}
                                            className="d-none"
                                            id="recon-file-input"
                                        />
                                        {reconFile && (
                                            <div className="mt-3 text-dark bg-light px-3 py-1.5 rounded-3 border d-flex align-items-center gap-2">
                                                <i className="fas fa-check-circle text-success"></i>
                                                <span className="font-weight-bold small">{reconFile.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={runReconciliation}
                                        disabled={!reconFile || reconLoading}
                                        className="btn btn-dark px-4 py-2.5 rounded-3 font-weight-bold shadow-sm d-flex align-items-center gap-2"
                                    >
                                        {reconLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <span>Đang xử lý đối soát...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-bolt"></i>
                                                <span>Chạy đối soát tự động</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {reconResult && (
                                <div className="mt-5 border-top pt-4">
                                    <h3 className="h6 font-weight-bold text-dark mb-3">Kết quả đối soát</h3>
                                    <div className="row g-3 mb-4">
                                        <div className="col-12 col-md-4">
                                            <div className="p-3 bg-light rounded-3 border">
                                                <p className="text-muted small font-weight-bold uppercase-label mb-1">Tổng GD hệ thống</p>
                                                <h4 className="font-weight-bold text-dark mb-0">{reconResult.totalSystem} giao dịch</h4>
                                            </div>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <div className="p-3 bg-success-light rounded-3 border border-success-subtle">
                                                <p className="text-success small font-weight-bold uppercase-label mb-1">Khớp hoàn toàn</p>
                                                <h4 className="font-weight-bold text-success mb-0">{reconResult.matched} giao dịch</h4>
                                            </div>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <div className="p-3 bg-danger-light rounded-3 border border-danger-subtle">
                                                <p className="text-danger small font-weight-bold uppercase-label mb-1">Bất thường (Lệch)</p>
                                                <h4 className="font-weight-bold text-danger mb-0">{reconResult.unmatched} giao dịch</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive rounded-3 border">
                                        <table className="table table-hover align-middle mb-0 text-sm">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="px-3 py-2.5">Mã GD</th>
                                                    <th className="px-3 py-2.5">Số tiền</th>
                                                    <th className="px-3 py-2.5">Cổng</th>
                                                    <th className="px-3 py-2.5">Đối soát</th>
                                                    <th className="px-3 py-2.5">Lý do/Chi tiết</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reconResult.details.map(d => (
                                                    <tr key={d.id}>
                                                        <td className="px-3 py-2.5 font-weight-bold text-dark">TX-{d.id}</td>
                                                        <td className="px-3 py-2.5 font-weight-bold">{formatCurrency(d.amount)}</td>
                                                        <td className="px-3 py-2.5 text-muted">{d.method}</td>
                                                        <td className="px-3 py-2.5">
                                                            <span className={`badge-pill-status ${d.reconStatus === 'matched' ? 'badge-success' : 'badge-danger'}`}>
                                                                {d.reconStatus === 'matched' ? 'KHỚP' : 'LỆCH'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-muted small">{d.reconReason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TRANSACTION DETAIL MODAL */}
            {selectedTx && (
                <div className="modal-backdrop-custom show">
                    <div className="modal-content-custom modal-size-lg">
                        <div className="modal-header-custom border-bottom bg-light">
                            <div>
                                <h3 className="modal-title-custom font-weight-bold text-dark mb-0">Chi tiết Giao dịch</h3>
                                <p className="text-muted small mb-0 font-mono">ID: TX-{selectedTx.id} | Đơn hàng: {selectedTx.orderCode}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="close-btn-custom">
                                &times;
                            </button>
                        </div>
                        <div className="modal-body-custom py-4">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Khách hàng</label>
                                        <p className="font-weight-bold text-dark mb-0">{selectedTx.customerName}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Mã Đơn Hàng</label>
                                        <p className="font-weight-bold text-dark mb-0">{selectedTx.orderCode}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Số tiền nhận</label>
                                        <p className="h3 font-weight-bold text-dark mb-1">{formatCurrency(selectedTx.amount)}</p>
                                        <span className="text-muted small">Phí Gateway: {formatCurrency(selectedTx.gatewayFee)}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Phương thức</label>
                                        <p className="font-weight-bold text-dark mb-0">{selectedTx.method}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Gateway Reference ID</label>
                                        <p className="font-mono text-dark bg-light p-2 rounded border small mb-0">{selectedTx.reference}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small font-weight-bold uppercase-label mb-1">Trạng thái hiện tại</label>
                                        <div>
                                            <span className={`badge-pill-status ${statusBadgeClass[selectedTx.status]}`}>
                                                {selectedTx.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="border-top pt-4 mt-2">
                                <label className="text-muted small font-weight-bold uppercase-label mb-3">Dòng thời gian sự kiện (Audit Trail)</label>
                                <div className="position-relative ps-4 border-start border-2 ms-2">
                                    <div className="position-relative mb-3 ps-2">
                                        <div className="position-absolute bg-success border border-white rounded-circle" style={{ width: '12px', height: '12px', left: '-30px', top: '4px' }}></div>
                                        <div>
                                            <p className="font-weight-bold mb-1 small text-dark">Cổng {selectedTx.method} báo thanh toán thành công</p>
                                            <span className="text-muted small">{new Date(selectedTx.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className="position-relative mb-3 ps-2">
                                        <div className="position-absolute bg-secondary border border-white rounded-circle" style={{ width: '12px', height: '12px', left: '-30px', top: '4px' }}></div>
                                        <div>
                                            <p className="font-weight-bold mb-1 small text-muted">Khách được redirect tới cổng thanh toán</p>
                                            <span className="text-muted small">{new Date(new Date(selectedTx.createdAt).getTime() - 60000).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className="position-relative ps-2">
                                        <div className="position-absolute bg-secondary border border-white rounded-circle" style={{ width: '12px', height: '12px', left: '-30px', top: '4px' }}></div>
                                        <div>
                                            <p className="font-weight-bold mb-1 small text-muted">Khởi tạo đơn hàng {selectedTx.orderCode} trên hệ thống</p>
                                            <span className="text-muted small">{new Date(new Date(selectedTx.createdAt).getTime() - 90000).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom d-flex justify-content-between gap-2 border-top">
                            <div className="d-flex gap-2">
                                {selectedTx.status === 'Paid' && (
                                    <button
                                        onClick={() => handleUpdateTxStatus(selectedTx.id, 'Refunded')}
                                        className="btn btn-danger btn-sm font-weight-bold rounded-3"
                                    >
                                        <i className="fas fa-undo mr-1.5"></i> Duyệt hoàn tiền
                                    </button>
                                )}
                                {selectedTx.status === 'Pending' && (
                                    <button
                                        onClick={() => handleUpdateTxStatus(selectedTx.id, 'Paid')}
                                        className="btn btn-success btn-sm font-weight-bold rounded-3"
                                    >
                                        <i className="fas fa-check mr-1.5"></i> Duyệt thanh toán thủ công
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="btn btn-outline-secondary btn-sm px-4 rounded-3"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GATEWAY EDIT MODAL */}
            {editingGateway && (
                <div className="modal-backdrop-custom show">
                    <div className="modal-content-custom">
                        <div className="modal-header-custom border-bottom bg-light">
                            <div>
                                <h3 className="modal-title-custom font-weight-bold text-dark mb-0">Cấu hình API</h3>
                                <p className="text-muted small mb-0">{editingGateway.name}</p>
                            </div>
                            <button onClick={() => setEditingGateway(null)} className="close-btn-custom">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSaveGateway}>
                            <div className="modal-body-custom py-4">
                                <div className="form-check form-switch p-3 bg-light rounded-3 mb-4 d-flex justify-content-between align-items-center">
                                    <label className="form-check-label font-weight-bold text-dark" htmlFor="activeSwitch">Kích hoạt cổng thanh toán</label>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="activeSwitch"
                                        checked={gatewayForm.active}
                                        onChange={(e) => setGatewayForm({ ...gatewayForm, active: e.target.checked })}
                                        style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label className="form-label text-muted small font-weight-bold uppercase-label mb-1">Môi trường</label>
                                        <select
                                            value={gatewayForm.environment}
                                            onChange={(e) => setGatewayForm({ ...gatewayForm, environment: e.target.value })}
                                            className="form-select shadow-none"
                                        >
                                            <option value="Sandbox">Sandbox (Test)</option>
                                            <option value="Production">Production</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-muted small font-weight-bold uppercase-label mb-1">Merchant ID</label>
                                        <input
                                            type="text"
                                            value={gatewayForm.merchantId}
                                            onChange={(e) => setGatewayForm({ ...gatewayForm, merchantId: e.target.value })}
                                            className="form-control shadow-none"
                                            placeholder="Merchant ID..."
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-muted small font-weight-bold uppercase-label mb-1">Client ID (API Key)</label>
                                    <input
                                        type="text"
                                        value={gatewayForm.clientId}
                                        onChange={(e) => setGatewayForm({ ...gatewayForm, clientId: e.target.value })}
                                        className="form-control shadow-none"
                                        placeholder="Client ID..."
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label text-muted small font-weight-bold uppercase-label mb-1">Secret Key</label>
                                    <div className="input-group">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            value={gatewayForm.clientSecret}
                                            onChange={(e) => setGatewayForm({ ...gatewayForm, clientSecret: e.target.value })}
                                            className="form-control shadow-none border-end-0"
                                            placeholder="Secret Key..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="btn btn-outline-secondary border-start-0"
                                        >
                                            <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-custom d-flex justify-content-between gap-2 border-top">
                                <button
                                    type="button"
                                    onClick={() => alert('Kết nối thử nghiệm Sandbox: Thành công!')}
                                    className="btn btn-outline-primary font-weight-bold"
                                >
                                    Test Connection
                                </button>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingGateway(null)}
                                        className="btn btn-outline-secondary"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-dark font-weight-bold"
                                    >
                                        Lưu cấu hình
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
