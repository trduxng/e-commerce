import React, { useState, useEffect } from 'react';
import { adminCartsApi } from '../services/api';
import { formatCurrency } from '../data/shopData';

const CurrentCarts = () => {
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => { loadCarts(); }, [page]);

    const loadCarts = async () => {
        setLoading(true);
        try {
            const response = await adminCartsApi.getActiveCarts({ page, pageSize });
            setCarts(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load shopping carts.');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <h1 className="m-0">Current Shopping Carts</h1>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-body table-responsive p-0">
                            {error && <div className="alert alert-danger m-3">{error}</div>}
                            {loading ? <div className="p-4 text-center">Loading carts...</div> : (
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Last Updated</th>
                                            <th>Items</th>
                                            <th>Total Value</th>
                                            <th>Contents</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carts.map(cart => (
                                            <tr key={cart.id}>
                                                <td>
                                                    <strong>{cart.user?.name}</strong>
                                                    <div className="text-muted small">{cart.user?.email}</div>
                                                </td>
                                                <td>{new Date(cart.updatedAt).toLocaleString('vi-VN')}</td>
                                                <td><span className="badge badge-primary">{cart.itemCount} items</span></td>
                                                <td>{formatCurrency(cart.totalValue)}</td>
                                                <td>
                                                    <ul className="list-unstyled mb-0 small">
                                                        {cart.items?.map(item => {
                                                            const details = [item.size, item.color].filter(Boolean).join('/');
                                                            return (
                                                                <li key={item.id}>
                                                                    {item.productName} {details ? `(${details})` : ''} x{item.quantity}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                        {carts.length === 0 && (
                                            <tr><td colSpan="5" className="text-center py-4">No active shopping carts found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="card-footer d-flex justify-content-between align-items-center">
                                <span className="text-muted">Showing page {page} of {totalPages} ({totalCount} total carts)</span>
                                <nav>
                                    <ul className="pagination pagination-sm m-0 float-right">
                                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" type="button" onClick={() => setPage(Math.max(1, page - 1))}>Previous</button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" type="button" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                            <button className="page-link" type="button" onClick={() => setPage(page + 1)}>Next</button>
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

export default CurrentCarts;
