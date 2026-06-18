import axios from 'axios';

const API_BASE_URL = '/api';

// Axios dùng chung cho toàn bộ frontend; ApiGateway xử lý tiền tố /api.
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động đính kèm JWT cho mọi request cần xác thực.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// GET được thử lại tối đa hai lần khi lỗi mạng/server; lỗi 401 sẽ kết thúc phiên đăng nhập.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const shouldRetry =
            config &&
            String(config.method || '').toLowerCase() === 'get' &&
            (!error.response || error.response.status >= 500) &&
            (config.__retryCount || 0) < 2;

        if (shouldRetry) {
            // Tăng thời gian chờ nhẹ giữa các lần thử để tránh gọi dồn dập.
            config.__retryCount = (config.__retryCount || 0) + 1;
            await new Promise((resolve) => setTimeout(resolve, 300 * config.__retryCount));
            return api(config);
        }

        if (error.response?.status === 401 && !config?.url?.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
};

// User API
export const userApi = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Product API
export const productApi = {
    getAll: (params) => api.get('/products', { params }),
    search: (params) => api.get('/products', { params }),
    getById: (id, params) => api.get(`/products/${id}`, { params }),
    getReviews: (id) => api.get(`/products/${id}/reviews`),
    saveReview: (id, data) => api.post(`/products/${id}/reviews`, data),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    updateSpecifications: (id, specs) => api.put(`/products/${id}/specifications`, specs),
};

export const specificationAttributeApi = {
    getAll: () => api.get('/specificationAttributes'),
    create: (data) => api.post('/specificationAttributes', data),
    update: (id, data) => api.put(`/specificationAttributes/${id}`, data),
    delete: (id) => api.delete(`/specificationAttributes/${id}`),
};

export const checkoutAttributeApi = {
    getAll: () => api.get('/checkoutAttributes'),
    create: (data) => api.post('/checkoutAttributes', data),
    update: (id, data) => api.put(`/checkoutAttributes/${id}`, data),
    delete: (id) => api.delete(`/checkoutAttributes/${id}`),
};

// Category API
export const categoryApi = {
    getAll: (params) => api.get('/categories', { params }),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Cart API
export const cartApi = {
    get: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
    removeItem: (productId) => api.delete(`/cart/items/${productId}`),
    clear: () => api.delete('/cart'),
    checkout: (data) => api.post('/cart/checkout', data),
};

// Address API
export const addressApi = {
    getMyAddresses: () => api.get('/addresses'),
    create: (data) => api.post('/addresses', data),
    update: (id, data) => api.put(`/addresses/${id}`, data),
    delete: (id) => api.delete(`/addresses/${id}`),
    setDefault: (id) => api.put(`/addresses/${id}/default`),
};

export const accountApi = {
    getDashboard: () => api.get('/account/dashboard'),
    getProfile: () => api.get('/account/profile'),
    updateProfile: (data) => api.put('/account/profile', data),
};

// Order API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    getMyOrders: () => api.get('/orders'),
    getAll: (params) => api.get('/orders/all', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    update: (id, data) => api.put(`/orders/${id}`, data),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
    requestReturn: (id) => api.put(`/orders/${id}/request-return`, {}),
    processReturn: (id, decision) => api.put(`/orders/${id}/return-decision`, { decision }),
    delete: (id) => api.delete(`/orders/${id}`),
};

export const settingApi = {
    get: () => api.get('/settings'),
    update: (data) => api.post('/settings', data),
};

export const adminCartsApi = {
    getActiveCarts: (params) => api.get('/adminCarts', { params }),
};

export const favoriteApi = {
    getAll: () => api.get('/favorites'),
    getIds: () => api.get('/favorites/ids'),
    add: (productId) => api.post(`/favorites/${productId}`),
    remove: (productId) => api.delete(`/favorites/${productId}`),
};

export const reviewApi = {
    getAll: (params) => api.get('/reviews', { params }),
    updateStatus: (id, status) => api.patch(`/reviews/${id}/status`, { status })
};

export const couponApi = {
    getAll: (params) => api.get('/coupons', { params }),
    create: (data) => api.post('/coupons', data),
    update: (id, data) => api.put(`/coupons/${id}`, data),
    delete: (id) => api.delete(`/coupons/${id}`),
    apply: (code, orderValue) => api.post('/coupons/apply', { code, orderValue })
};

export const manufacturerApi = {
    getAll: (params) => api.get('/manufacturers', { params }),
    getById: (id) => api.get(`/manufacturers/${id}`),
    create: (data) => api.post('/manufacturers', data),
    update: (id, data) => api.put(`/manufacturers/${id}`, data),
    delete: (id) => api.delete(`/manufacturers/${id}`),
};

// Payment Management APIs (Mock data handler for UI/UX demonstration)
export const paymentApi = {
    getAllTransactions: async () => {
        // Mock server response
        const stored = localStorage.getItem('mock_transactions');
        if (stored) return { data: JSON.parse(stored) };
        
        const initialMock = [
            { id: 1001, orderCode: 'ORD-5892', amount: 1250000, gatewayFee: 18750, method: 'VNPAY', status: 'Paid', reference: 'VNP29384729', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), customerName: 'Nguyễn Văn A' },
            { id: 1002, orderCode: 'ORD-9281', amount: 450000, gatewayFee: 0, method: 'COD', status: 'Pending', reference: 'N/A', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), customerName: 'Trần Thị B' },
            { id: 1003, orderCode: 'ORD-1029', amount: 3200000, gatewayFee: 48000, method: 'PayPal', status: 'Paid', reference: 'PAYID-M928374', createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), customerName: 'Lê Hoàng C' },
            { id: 1004, orderCode: 'ORD-3829', amount: 890000, gatewayFee: 13350, method: 'MoMo', status: 'Failed', reference: 'MOMO-ERR-99', createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), customerName: 'Phạm Minh D' },
            { id: 1005, orderCode: 'ORD-8821', amount: 1500000, gatewayFee: 0, method: 'BankTransfer', status: 'Paid', reference: 'FT2628109283', createdAt: new Date(Date.now() - 3600000 * 30).toISOString(), customerName: 'Hoàng Văn E' },
            { id: 1006, orderCode: 'ORD-4491', amount: 600000, gatewayFee: 9000, method: 'VNPAY', status: 'Refunded', reference: 'VNP29384210', createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), customerName: 'Vũ Thu H' }
        ];
        localStorage.setItem('mock_transactions', JSON.stringify(initialMock));
        return { data: initialMock };
    },
    updateTransactionStatus: async (id, status) => {
        const stored = JSON.parse(localStorage.getItem('mock_transactions') || '[]');
        const updated = stored.map(t => t.id === id ? { ...t, status } : t);
        localStorage.setItem('mock_transactions', JSON.stringify(updated));
        return { data: updated.find(t => t.id === id) };
    },
    getGateways: async () => {
        const stored = localStorage.getItem('mock_gateways');
        if (stored) return { data: JSON.parse(stored) };
        const initialGateways = [
            { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', active: true, environment: 'Production', testMode: false, clientId: '', clientSecret: '', merchantId: '' },
            { id: 'banktransfer', name: 'Chuyển khoản Ngân hàng', active: true, environment: 'Production', testMode: false, clientId: '', clientSecret: '', merchantId: '' },
            { id: 'vnpay', name: 'Cổng thanh toán VNPAY', active: true, environment: 'Sandbox', testMode: true, clientId: 'VNPAY_MERCHANT_01', clientSecret: 'SECRET_VNPAY_API_KEY_123', merchantId: 'VNPAY_TMN_CODE' },
            { id: 'momo', name: 'Ví điện tử MoMo', active: false, environment: 'Sandbox', testMode: true, clientId: 'MOMO_PARTNER_01', clientSecret: 'SECRET_MOMO_API_KEY_456', merchantId: 'MOMO_MERCHANT_ID' },
            { id: 'paypal', name: 'Cổng thanh toán PayPal', active: true, environment: 'Sandbox', testMode: true, clientId: 'PAYPAL_CLIENT_ID_XYZ', clientSecret: 'SECRET_PAYPAL_API_KEY_789', merchantId: 'PAYPAL_MERCHANT_XYZ' }
        ];
        localStorage.setItem('mock_gateways', JSON.stringify(initialGateways));
        return { data: initialGateways };
    },
    updateGateway: async (id, data) => {
        const stored = JSON.parse(localStorage.getItem('mock_gateways') || '[]');
        const updated = stored.map(g => g.id === id ? { ...g, ...data } : g);
        localStorage.setItem('mock_gateways', JSON.stringify(updated));
        return { data: updated.find(g => g.id === id) };
    }
};

export default api;
