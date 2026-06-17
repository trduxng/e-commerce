import React, { useState, useEffect } from 'react';
import { manufacturerApi } from '../services/api';



const Manufacturers = () => {
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', pictureUrl: '', sortOrder: 0, isActive: true
    });

    useEffect(() => { loadManufacturers(); }, []);

    const loadManufacturers = async () => {
        setLoading(true);
        try {
            const response = await manufacturerApi.getAll({ page: 1, pageSize: 50 });
            setManufacturers(response.data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await manufacturerApi.update(editingBrand.id, { ...formData, id: editingBrand.id });
            } else {
                await manufacturerApi.create(formData);
            }
            setShowModal(false);
            loadManufacturers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving manufacturer');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this manufacturer?')) {
            await manufacturerApi.delete(id);
            loadManufacturers();
        }
    };

    const openModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData(brand);
        } else {
            setEditingBrand(null);
            setFormData({ name: '', description: '', pictureUrl: '', sortOrder: 0, isActive: true });
        }
        setShowModal(true);
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid d-flex justify-content-between">
                    <h1 className="m-0">Manufacturers / Brands</h1>
                    <button className="btn btn-primary" onClick={() => openModal()}>Add New Brand</button>
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
                                            <th>Logo</th>
                                            <th>Name</th>
                                            <th>Sort Order</th>
                                            <th>Active</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manufacturers.map(b => (
                                            <tr key={b.id}>
                                                <td>
                                                    {b.pictureUrl ? <img src={b.pictureUrl} alt={b.name} style={{height: 40, width: 'auto'}} /> : <span className="text-muted">No Image</span>}
                                                </td>
                                                <td><strong>{b.name}</strong></td>
                                                <td>{b.sortOrder}</td>
                                                <td>{b.isActive ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(b)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
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
                                    <h5 className="modal-title">{editingBrand ? 'Edit' : 'Add'} Brand</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Brand Name</label>
                                        <input className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Logo (optional)</label>
                                        <div className="input-group">
                                            <input 
                                                className="form-control" 
                                                value={formData.pictureUrl || ''} 
                                                onChange={e => setFormData({...formData, pictureUrl: e.target.value})} 
                                                placeholder="/img/vendor-1.jpg or custom URL"
                                            />
                                            <div className="input-group-append">
                                                <label className="btn btn-secondary m-0 d-flex align-items-center">
                                                    Browse...
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        style={{ display: 'none' }} 
                                                        onChange={e => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setFormData({...formData, pictureUrl: `/img/${file.name}`});
                                                            }
                                                        }} 
                                                    />
                                                </label>
                                            </div>
                                        </div>
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

export default Manufacturers;