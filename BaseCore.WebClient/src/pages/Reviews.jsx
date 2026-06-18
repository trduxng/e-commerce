import React, { useState, useEffect } from 'react';
import { reviewApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        loadReviews();
    }, [page, statusFilter]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const response = await reviewApi.getAll({ page, pageSize, status: statusFilter });
            setReviews(response.data.items || []);
            setTotalPages(response.data.totalPages || 0);
            setError('');
        } catch (err) {
            setError('Không thể tải đánh giá sản phẩm.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await reviewApi.updateStatus(id, newStatus);
            loadReviews();
        } catch (err) {
            alert('Cập nhật trạng thái đánh giá thất bại.');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <small key={index} className={`fa fa-star ${index < rating ? 'text-primary' : 'text-muted'}`}></small>
        ));
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Bị từ chối';
            case 'pending': return 'Chờ duyệt';
            default: return status;
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <h1 className="m-0">Đánh giá sản phẩm</h1>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <select 
                                className="form-control w-25" 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="approved">Đã duyệt</option>
                                <option value="rejected">Bị từ chối</option>
                            </select>
                        </div>
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-danger m-3">{error}</div>}
                            {loading ? (
                                <div className="text-center p-4">Đang tải...</div>
                            ) : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Khách hàng</th>
                                            <th>Đánh giá</th>
                                            <th>Nội dung</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">Không tìm thấy đánh giá nào</td>
                                            </tr>
                                        ) : (
                                            reviews.map(review => (
                                                <tr key={review.id}>
                                                    <td>{review.product?.name}</td>
                                                    <td>{review.user?.email}</td>
                                                    <td>{renderStars(review.rating)}</td>
                                                    <td className="text-wrap" style={{maxWidth: '300px'}}>{review.content}</td>
                                                    <td>
                                                        <span className={`badge badge-${review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'danger' : 'warning'}`}>
                                                            {getStatusText(review.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {review.status !== 'approved' && (
                                                            <button className="btn btn-sm btn-success mr-2" onClick={() => handleStatusChange(review.id, 'approved')}>Duyệt</button>
                                                        )}
                                                        {review.status !== 'rejected' && (
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(review.id, 'rejected')}>Từ chối</button>
                                                        )}
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
        </div>
    );
};

export default Reviews;
