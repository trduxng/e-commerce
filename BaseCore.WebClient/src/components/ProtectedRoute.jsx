import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isStaff, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
    }

    if (adminOnly && !isStaff()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
