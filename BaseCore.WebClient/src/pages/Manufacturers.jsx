import React, { useState, useEffect } from 'react';
import { manufacturerApi } from '../services/api';
import { utils, writeFile, read } from 'xlsx';



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

    const exportToExcel = () => {
        if (manufacturers.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        const exportData = manufacturers.map(m => ({
            'ID': m.id,
            'Tên nhà sản xuất': m.name,
            'Mô tả': m.description || '',
            'Thứ tự': m.sortOrder || 0,
            'Trạng thái': m.isActive ? 'Kích hoạt' : 'Ẩn'
        }));
        
        const worksheet = utils.json_to_sheet(exportData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Manufacturers");
        writeFile(workbook, "nha_san_xuat.xlsx");
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = utils.sheet_to_json(ws);
                
                let successCount = 0;
                for (const row of data) {
                    const newItem = {
                        name: row['Tên nhà sản xuất'] || row['name'] || '',
                        description: row['Mô tả'] || row['description'] || '',
                        sortOrder: Number(row['Thứ tự']) || 0,
                        isActive: true
                    };
                    if (newItem.name) {
                        await manufacturerApi.create(newItem);
                        successCount++;
                    }
                }
                alert(`Nhập thành công ${successCount} nhà sản xuất!`);
                loadManufacturers();
            } catch (error) {
                console.error("Import error:", error);
                alert("Đã xảy ra lỗi khi nhập file Excel.");
            }
        };
        reader.readAsBinaryString(file);
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
                        <button type="button" className="btn btn-success" onClick={exportToExcel}>
                            <i className="fas fa-download"></i>
                            {' '}Xuất file
                        </button>
                    </div>
                    <input type="file" accept=".xlsx, .xls" id="import-manufacturers" style={{ display: 'none' }} onChange={handleImportExcel} />
                    <label htmlFor="import-manufacturers" className="btn bg-olive ml-1 mb-0" style={{ cursor: 'pointer', verticalAlign: 'baseline', height: '100%' }}>
                        <i className="fas fa-upload"></i> Nhập file
                    </label>
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
