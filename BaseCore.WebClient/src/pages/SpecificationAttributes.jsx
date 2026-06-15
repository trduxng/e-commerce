import React, { useState, useEffect } from 'react';
import { specificationAttributeApi } from '../services/api';

const SpecificationAttributes = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAttr, setEditingAttr] = useState(null);
    const [formData, setFormData] = useState({ name: '', sortOrder: 0, isActive: true });

    useEffect(() => { loadAttributes(); }, []);

    const loadAttributes = async () => {
        setLoading(true);
        try {
            const response = await specificationAttributeApi.getAll();
            setAttributes(response.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingAttr) {
                await specificationAttributeApi.update(editingAttr.id, { ...formData, id: editingAttr.id });
            } else {
                await specificationAttributeApi.create(formData);
            }
            setShowModal(false);
            loadAttributes();
        } catch (err) {
            alert('Error saving attribute');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this attribute?')) {
            await specificationAttributeApi.delete(id);
            loadAttributes();
        }
    };

    const openModal = (attr = null) => {
        if (attr) {
            setEditingAttr(attr);
            setFormData(attr);
        } else {
            setEditingAttr(null);
            setFormData({ name: '', sortOrder: 0, isActive: true });
        }
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between">
                    <h1 className="m-0">Specification Attributes</h1>
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
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Sort Order</th>
                                            <th>Active</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attributes.map(a => (
                                            <tr key={a.id}>
                                                <td>{a.id}</td>
                                                <td><strong>{a.name}</strong></td>
                                                <td>{a.sortOrder}</td>
                                                <td>{a.isActive ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(a)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Delete</button>
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
                                    <h5 className="modal-title">{editingAttr ? 'Edit' : 'Add'} Attribute</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Attribute Name (e.g., RAM, CPU, Color)</label>
                                        <input className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Sort Order</label>
                                        <input type="number" className="form-control" required value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
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

export default SpecificationAttributes;
