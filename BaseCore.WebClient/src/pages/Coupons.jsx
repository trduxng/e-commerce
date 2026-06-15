import React, { useState, useEffect } from 'react';
import { couponApi } from '../services/api';

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '', type: 'percent', value: 0, minOrderValue: 0, maxDiscountAmount: 0,
        usageLimit: '', startDate: '', endDate: '', isActive: true
    });

    useEffect(() => { loadCoupons(); }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const response = await couponApi.getAll({ page: 1, pageSize: 50 });
            setCoupons(response.data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCoupon) {
                await couponApi.update(editingCoupon.id, { ...formData, id: editingCoupon.id });
            } else {
                await couponApi.create(formData);
            }
            setShowModal(false);
            loadCoupons();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving coupon');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this coupon?')) {
            await couponApi.delete(id);
            loadCoupons();
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                startDate: coupon.startDate.split('T')[0],
                endDate: coupon.endDate.split('T')[0]
            });
        } else {
            setEditingCoupon(null);
            setFormData({ code: '', type: 'percent', value: 0, minOrderValue: 0, startDate: '', endDate: '', isActive: true });
        }
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between">
                    <h1 className="m-0">Discount Coupons</h1>
                    <button className="btn btn-primary" onClick={() => openModal()}>Create Coupon</button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-body table-responsive p-0">
                            {loading ? <div className="p-4">Loading...</div> : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Min Order</th>
                                            <th>Active</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons.map(c => (
                                            <tr key={c.id}>
                                                <td><strong>{c.code}</strong></td>
                                                <td>{c.type}</td>
                                                <td>{c.value}</td>
                                                <td>{c.minOrderValue}</td>
                                                <td>{c.isActive ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(c)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingCoupon ? 'Edit' : 'Create'} Coupon</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Code</label>
                                        <input className="form-control" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option value="percent">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Value</label>
                                        <input type="number" className="form-control" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} /> Active
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                    <button type="submit" className="btn btn-primary">Save changes</button>
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
