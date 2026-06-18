import React, { useState, useEffect } from 'react';
import { checkoutAttributeApi } from '../services/api';

const CheckoutAttributes = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAttr, setEditingAttr] = useState(null);
    const [formData, setFormData] = useState({ name: '', controlType: 'DropdownList', isRequired: false, sortOrder: 0, isActive: true, values: [] });

    useEffect(() => { loadAttributes(); }, []);

    const loadAttributes = async () => {
        setLoading(true);
        try {
            const response = await checkoutAttributeApi.getAll();
            setAttributes(response.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cấu hình dịch vụ bổ sung và các mức phụ phí hiển thị tại checkout.
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingAttr) {
                await checkoutAttributeApi.update(editingAttr.id, { ...formData, id: editingAttr.id });
            } else {
                await checkoutAttributeApi.create(formData);
            }
            setShowModal(false);
            loadAttributes();
        } catch (err) {
            alert('Error saving attribute');
        }
    };

    const addValue = () => {
        setFormData({ ...formData, values: [...formData.values, { name: '', priceAdjustment: 0, isPreSelected: false, sortOrder: 0 }] });
    };

    const updateValue = (index, field, val) => {
        const nextValues = [...formData.values];
        nextValues[index] = { ...nextValues[index], [field]: val };
        setFormData({ ...formData, values: nextValues });
    };

    const removeValue = (index) => {
        setFormData({ ...formData, values: formData.values.filter((_, i) => i !== index) });
    };

    const openModal = (attr = null) => {
        if (attr) {
            setEditingAttr(attr);
            setFormData(attr);
        } else {
            setEditingAttr(null);
            setFormData({ name: '', controlType: 'DropdownList', isRequired: false, sortOrder: 0, isActive: true, values: [] });
        }
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between">
                    <h1 className="m-0">Checkout Attributes</h1>
                    <button className="btn btn-primary" onClick={() => openModal()}>Add New Attribute</button>
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
                                            <th>Name</th>
                                            <th>Control Type</th>
                                            <th>Required</th>
                                            <th>Values</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attributes.map(a => (
                                            <tr key={a.id}>
                                                <td><strong>{a.name}</strong></td>
                                                <td>{a.controlType}</td>
                                                <td>{a.isRequired ? 'Yes' : 'No'}</td>
                                                <td>{a.values?.length || 0} values</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(a)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => checkoutAttributeApi.delete(a.id).then(loadAttributes)}>Delete</button>
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
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5>{editingAttr ? 'Edit' : 'Add'} Checkout Attribute</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group"><label>Name (e.g. Gift Wrap)</label><input className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                            <div className="form-group"><label>Control Type</label>
                                                <select className="form-control" value={formData.controlType} onChange={e => setFormData({...formData, controlType: e.target.value})}>
                                                    <option value="DropdownList">Dropdown</option>
                                                    <option value="RadioList">Radio Buttons</option>
                                                    <option value="Checkboxes">Checkboxes</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group mt-4"><label><input type="checkbox" checked={formData.isRequired} onChange={e => setFormData({...formData, isRequired: e.target.checked})} /> Required?</label></div>
                                            <div className="form-group"><label>Sort Order</label><input type="number" className="form-control" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} /></div>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between align-items-center mb-2"><h6>Attribute Values</h6><button type="button" className="btn btn-sm btn-outline-primary" onClick={addValue}>+ Add Value</button></div>
                                    <table className="table table-sm border">
                                        <thead><tr><th>Name</th><th>Price Adjustment</th><th>Pre-selected</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {formData.values.map((v, i) => (
                                                <tr key={i}>
                                                    <td><input className="form-control form-control-sm" value={v.name} onChange={e => updateValue(i, 'name', e.target.value)} required /></td>
                                                    <td><input type="number" className="form-control form-control-sm" value={v.priceAdjustment} onChange={e => updateValue(i, 'priceAdjustment', Number(e.target.value))} /></td>
                                                    <td className="text-center"><input type="checkbox" checked={v.isPreSelected} onChange={e => updateValue(i, 'isPreSelected', e.target.checked)} /></td>
                                                    <td><button type="button" className="btn btn-sm text-danger" onClick={() => removeValue(i)}>x</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutAttributes;
