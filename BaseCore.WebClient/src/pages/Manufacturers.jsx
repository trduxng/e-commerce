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

    // Một modal dùng chung cho tạo mới và chỉnh sửa nhà sản xuất.
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
            alert(err.response?.data?.message || 'Lỗi khi lưu nhà sản xuất');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhà sản xuất này không?')) {
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
            <div className="content-header clearfix">
                <h1 className="float-left">
                    Nhà sản xuất
                </h1>
                <div className="float-right">
                    <button type="button" className="btn btn-primary" onClick={() => openModal()}>
                        <i className="fas fa-plus-square"></i>
                        {' '}Thêm mới
                    </button>
                    <div className="btn-group ml-1">
                        <button type="button" className="btn btn-success">
                            <i className="fas fa-download"></i>
                            {' '}Xuất file
                        </button>
                        <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            <span className="caret"></span>
                            <span className="sr-only">&nbsp;</span>
                        </button>
                    </div>
                    <button type="button" className="btn bg-olive ml-1">
                        <i className="fas fa-upload"></i>
                        {' '}Nhập file
                    </button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-body table-responsive p-0">
                            {loading ? <div className="p-4">Đang tải...</div> : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Logo</th>
                                            <th>Tên thương hiệu</th>
                                            <th>Thứ tự sắp xếp</th>
                                            <th>Kích hoạt</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manufacturers.map(b => (
                                            <tr key={b.id}>
                                                <td>
                                                    {b.pictureUrl ? <img src={b.pictureUrl} alt={b.name} style={{height: 40, width: 'auto'}} /> : <span className="text-muted">Không có ảnh</span>}
                                                </td>
                                                <td><strong>{b.name}</strong></td>
                                                <td>{b.sortOrder}</td>
                                                <td>{b.isActive ? 'Có' : 'Không'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-2" onClick={() => openModal(b)}>Sửa</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Xóa</button>
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
                                    <h5 className="modal-title">{editingBrand ? 'Sửa' : 'Thêm'} Thương hiệu</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Tên thương hiệu</label>
                                        <input className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Logo (tùy chọn)</label>
                                        <div className="input-group">
                                            <input 
                                                className="form-control" 
                                                value={formData.pictureUrl || ''} 
                                                onChange={e => setFormData({...formData, pictureUrl: e.target.value})} 
                                                placeholder="/img/vendor-1.jpg hoặc URL tùy chỉnh"
                                            />
                                            <div className="input-group-append">
                                                <label className="btn btn-secondary m-0 d-flex align-items-center">
                                                    Tải ảnh lên...
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
                                        <label>Thứ tự sắp xếp</label>
                                        <input type="number" className="form-control" required value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
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

export default Manufacturers;
