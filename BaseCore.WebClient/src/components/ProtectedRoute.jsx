import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
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
        // Ghi nhớ trang hiện tại để quay lại đúng luồng sau khi đăng nhập.
        const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
    }

    // Route quản trị được bảo vệ thêm bằng role, không chỉ trạng thái đăng nhập.
    if (adminOnly && !isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
