import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
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

// Handle response errors
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
            config.__retryCount = (config.__retryCount || 0) + 1;
            await new Promise((resolve) => setTimeout(resolve, 300 * config.__retryCount));
            return api(config);
        }

        if (error.response?.status === 401) {
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
    getById: (id) => api.get(`/products/${id}`),
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
    delete: (id) => api.delete(`/orders/${id}`),
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

export default api;
