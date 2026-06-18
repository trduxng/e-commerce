import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { getApiErrorMessage } from '../data/shopData';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Khôi phục phiên đăng nhập từ localStorage khi ứng dụng được tải lại.
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authApi.login(username, password);
            const userData = response.data;

            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            // Tài khoản mock chỉ phục vụ demo khi backend không hoạt động.
            if ((username === 'admin' && password === 'admin123') || (username === 'admin@gmail.com' && password === '123')) {
                const mockUserData = {
                    id: 1,
                    username: 'admin@gmail.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@gmail.com',
                    role: 'Admin',
                    token: 'mock-jwt-token-for-admin-dashboard'
                };
                localStorage.setItem('token', mockUserData.token);
                localStorage.setItem('user', JSON.stringify(mockUserData));
                setUser(mockUserData);
                return { success: true, user: mockUserData };
            }
            const message = getApiErrorMessage(error, 'Đăng nhập không thành công.');
            return { success: false, message };
        }
    };

    const register = async (data) => {
        try {
            await authApi.register(data);
            return { success: true };
        } catch (error) {
            const message = getApiErrorMessage(error, 'Đăng ký không thành công.');
            return { success: false, message };
        }
    };

    const logout = () => {
        // Xóa đồng thời token và dữ liệu user để các context phụ thuộc tự reset.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateStoredUser = (updates) => {
        // Đồng bộ thay đổi hồ sơ vào cả React state và localStorage.
        setUser((current) => {
            const nextUser = { ...current, ...updates };
            localStorage.setItem('user', JSON.stringify(nextUser));
            return nextUser;
        });
    };

    const isAdmin = () => {
        return String(user?.role || '').toLowerCase() === 'admin';
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateStoredUser,
        isAdmin,
        isAuthenticated: !!user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
