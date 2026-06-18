import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [sortField, setSortField] = useState('order');
    const [sortDir, setSortDir] = useState('asc');
    const [savingCategory, setSavingCategory] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState('');
    const { isStaff } = useAuth();

    useEffect(() => {
        loadCategories();
    }, [keyword, page, sortField, sortDir]);

    // Danh mục được tải theo từ khóa và phân trang để phục vụ bảng quản trị.
    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryApi.getAll({ keyword, page, pageSize, sortField, sortDir });
            const items = Array.isArray(response.data?.items)
                ? response.data.items
                : Array.isArray(response.data)
                    ? response.data
                    : [];

            if (!Array.isArray(response.data?.items) && !Array.isArray(response.data)) {
                setCategories([]);
                setError('API danh mục không trả về danh sách hợp lệ. Hãy kiểm tra xem ApiGateway và APIService có đang chạy không.');
                return;
            }

            setCategories(items);
            setTotalPages(Number(response.data?.totalPages) || 0);
            setTotalCount(Number(response.data?.totalCount) || items.length);
        } catch (error) {
            console.error('Tải danh mục thất bại:', error);
            setCategories([]);
            setError(error.response?.data?.message || 'Tải danh mục thất bại. Hãy kiểm tra xem ApiGateway và APIService có đang chạy không.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (event) => {
        setKeyword(event.target.value);
        setPage(1);
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
            });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setError('');
    };

    // Một form dùng chung cho tạo mới và cập nhật danh mục.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSavingCategory(true);

        try {
            if (editingCategory) {
                await categoryApi.update(editingCategory.id, {
                    id: editingCategory.id,
                    ...formData,
                });
            } else {
                await categoryApi.create(formData);
            }

            closeModal();
            loadCategories();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) return;

        try {
            await categoryApi.delete(id);
            loadCategories();
        } catch (error) {
            alert('Xóa danh mục thất bại. Danh mục này có thể đang chứa sản phẩm.');
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" type="button" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Danh mục</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-md-7">
                                    <form className="form-inline" onSubmit={(event) => event.preventDefault()}>
                                        <input
                                            type="search"
                                            className="form-control mr-2"
                                            placeholder="Tìm kiếm danh mục..."
                                            value={keyword}
                                            onChange={handleSearchChange}
                                        />
                                        {keyword && (
                                            <button
                                                className="btn btn-outline-secondary mr-2"
                                                type="button"
                                                disabled={loading}
                                                onClick={() => {
                                                    setKeyword('');
                                                    setPage(1);
                                                }}
                                            >
                                                Xóa tìm kiếm
                                            </button>
                                        )}
                                        <select className="form-control mr-2" value={sortField} onChange={e => setSortField(e.target.value)}>
                                            <option value="order">Thứ tự hiển thị</option>
                                            <option value="name">Tên danh mục</option>
                                            <option value="created">Ngày tạo</option>
                                        </select>
                                        <select className="form-control mr-2" value={sortDir} onChange={e => setSortDir(e.target.value)}>
                                            <option value="asc">Tăng dần</option>
                                            <option value="desc">Giảm dần</option>
                                        </select>
                                        <button className="btn btn-primary" type="button" disabled={loading} onClick={() => loadCategories()}>
                                            {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                            Tìm kiếm
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-5 text-right">
                                    {isStaff() && (
                                        <button className="btn btn-success" onClick={() => openModal()}>
                                            <i className="fas fa-plus"></i> Thêm Danh mục
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-warning">{error}</div>}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '80px' }}>Mã (ID)</th>
                                                <th>Tên danh mục</th>
                                                <th>Mô tả</th>
                                                {isStaff() && <th style={{ width: '150px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isStaff() ? 4 : 3} className="text-center">
                                                        {keyword ? 'Không tìm thấy danh mục nào phù hợp với tìm kiếm' : 'Không có danh mục nào'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                categories.map(category => (
                                                    <tr key={category.id}>
                                                        <td>{category.id}</td>
                                                        <td>{category.name}</td>
                                                        <td>{category.description}</td>
                                                        {isStaff() && (
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-info mr-1"
                                                                    onClick={() => openModal(category)}
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDelete(category.id)}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>Tổng cộng: {totalCount} danh mục</span>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingCategory ? 'Sửa Danh mục' : 'Thêm Danh mục'}
                                </h5>
                                <button type="button" className="close" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Tên danh mục</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea
                                            className="form-control"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" disabled={savingCategory} onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={savingCategory}>
                                        {savingCategory ? <><i className="fas fa-spinner fa-spin mr-1"></i>Đang lưu...</> : (editingCategory ? 'Cập nhật' : 'Tạo mới')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default Categories;
