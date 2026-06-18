import React, { useState, useEffect } from 'react';
import { couponApi } from '../services/api';

const emptyCouponForm = {
    code: '',
    type: 'percent',
    value: '',
    minOrderValue: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
};

const toDateInputValue = (value) => value ? String(value).split('T')[0] : '';

const toNullableNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState(emptyCouponForm);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => { loadCoupons(); }, [page]);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const response = await couponApi.getAll({ page, pageSize });
            setCoupons(response.data.items || []);
            setTotalPages(response.data.totalPages || 0);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Tải danh sách mã giảm giá thất bại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            code: formData.code.trim(),
            type: formData.type,
            value: Number(formData.value),
            minOrderValue: Number(formData.minOrderValue) || 0,
            maxDiscountAmount: toNullableNumber(formData.maxDiscountAmount),
            usageLimit: toNullableNumber(formData.usageLimit),
            startDate: formData.startDate,
            endDate: formData.endDate,
            isActive: formData.isActive,
            usedCount: editingCoupon?.usedCount || 0,
        };

        try {
            if (editingCoupon) {
                await couponApi.update(editingCoupon.id, { ...payload, id: editingCoupon.id });
            } else {
                await couponApi.create(payload);
            }
            setShowModal(false);
            loadCoupons();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi lưu mã giảm giá');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
            await couponApi.delete(id);
            loadCoupons();
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code || '',
                type: coupon.type || 'percent',
                value: coupon.value ?? '',
                minOrderValue: String(coupon.minOrderValue ?? 0),
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                usageLimit: coupon.usageLimit || '',
                startDate: toDateInputValue(coupon.startDate),
                endDate: toDateInputValue(coupon.endDate),
                isActive: coupon.isActive !== false,
            });
        } else {
            setEditingCoupon(null);
            setFormData(emptyCouponForm);
        }
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between">
                    <h1 className="m-0">Mã giảm giá</h1>
                    <button className="btn btn-primary" onClick={() => openModal()}>Tạo mã giảm giá</button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-danger m-3">{error}</div>}
                            {loading ? <div className="p-4">Đang tải...</div> : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Mã</th>
                                            <th>Loại</th>
                                            <th>Giá trị</th>
                                            <th>Đơn tối thiểu</th>
                                            <th>Giới hạn</th>
                                            <th>Đã dùng</th>
                                            <th>Kích hoạt</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">Không có mã giảm giá nào</td>
                                            </tr>
                                        ) : (
                                            coupons.map(c => (
                                                <tr key={c.id}>
                                                    <td><strong>{c.code}</strong></td>
                                                    <td>{c.type === 'percent' ? 'Phần trăm (%)' : 'Số tiền cố định'}</td>
                                                    <td>{c.value}</td>
                                                    <td>{c.minOrderValue}</td>
                                                    <td>{c.usageLimit || 'Không giới hạn'}</td>
                                                    <td>{c.usedCount || 0}</td>
                                                    <td>{c.isActive ? 'Có' : 'Không'}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(c)}>Sửa</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Xóa</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="card-footer d-flex justify-content-between align-items-center">
                                <span className="text-muted">Trang {page} / {totalPages}</span>
                                <nav>
                                    <ul className="pagination pagination-sm m-0 float-right">
                                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" type="button" onClick={() => setPage(Math.max(1, page - 1))}>Trước</button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" type="button" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                            <button className="page-link" type="button" onClick={() => setPage(page + 1)}>Sau</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingCoupon ? 'Sửa' : 'Tạo'} Mã giảm giá</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Mã (Code)</label>
                                        <input className="form-control" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Loại</label>
                                        <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option value="percent">Phần trăm (%)</option>
                                            <option value="fixed">Số tiền cố định</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Giá trị</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.value}
                                            onChange={e => setFormData({...formData, value: e.target.value})}
                                        />
                                        <small className="text-muted">
                                            Loại phần trăm dùng 1-100. Loại cố định dùng số tiền thực tế.
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label>Giá trị đơn hàng tối thiểu</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                            value={formData.minOrderValue}
                                            onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Số tiền giảm tối đa</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                            placeholder="Bỏ trống nếu không giới hạn"
                                            value={formData.maxDiscountAmount}
                                            onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giới hạn lượt sử dụng</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            step="1"
                                            placeholder="Bỏ trống nếu không giới hạn"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày bắt đầu</label>
                                        <input type="date" className="form-control" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày kết thúc</label>
                                        <input type="date" className="form-control" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} /> Kích hoạt
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Coupons;
