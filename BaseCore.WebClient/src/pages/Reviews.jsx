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
            setError('Failed to load reviews.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await reviewApi.updateStatus(id, newStatus);
            loadReviews();
        } catch (err) {
            alert('Failed to update review status.');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <small key={index} className={`fa fa-star ${index < rating ? 'text-primary' : 'text-muted'}`}></small>
        ));
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <h1 className="m-0">Product Reviews</h1>
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
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-danger m-3">{error}</div>}
                            {loading ? (
                                <div className="text-center p-4">Loading...</div>
                            ) : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Customer</th>
                                            <th>Rating</th>
                                            <th>Content</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map(review => (
                                            <tr key={review.id}>
                                                <td>{review.product?.name}</td>
                                                <td>{review.user?.email}</td>
                                                <td>{renderStars(review.rating)}</td>
                                                <td className="text-wrap" style={{maxWidth: '300px'}}>{review.content}</td>
                                                <td>
                                                    <span className={`badge badge-${review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'danger' : 'warning'}`}>
                                                        {review.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {review.status !== 'approved' && (
                                                        <button className="btn btn-sm btn-success mr-2" onClick={() => handleStatusChange(review.id, 'approved')}>Approve</button>
                                                    )}
                                                    {review.status !== 'rejected' && (
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(review.id, 'rejected')}>Reject</button>
                                                    )}
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
        </div>
    );
};

export default Reviews;
