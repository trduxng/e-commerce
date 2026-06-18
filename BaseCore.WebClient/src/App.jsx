import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import ShopLayout from './components/ShopLayout';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const Orders = lazy(() => import('./pages/Orders'));
const Revenue = lazy(() => import('./pages/Revenue'));
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Contact = lazy(() => import('./pages/Contact'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Account = lazy(() => import('./pages/Account'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Manufacturers = lazy(() => import('./pages/Manufacturers'));
const SpecificationAttributes = lazy(() => import('./pages/SpecificationAttributes'));
const CheckoutAttributes = lazy(() => import('./pages/CheckoutAttributes'));
const CurrentCarts = lazy(() => import('./pages/CurrentCarts'));
const Settings = lazy(() => import('./pages/Settings'));
const Payments = lazy(() => import('./pages/Payments'));

const queryClient = new QueryClient();
const adminPaths = ['/admin'];
const isAdminPath = (path) => adminPaths.some((adminPath) => path === adminPath || path.startsWith(`${adminPath}/`));

// Không cho người dùng đã đăng nhập quay lại trang đăng nhập/đăng ký.
// returnUrl chỉ được chấp nhận khi là đường dẫn nội bộ để tránh chuyển hướng ra website lạ.
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();
    const location = useLocation();
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        const targetUrl = safeReturnUrl && (isAdmin() || !isAdminPath(safeReturnUrl))
            ? safeReturnUrl
            : (isAdmin() ? '/dashboard' : '/');
        return <Navigate to={targetUrl} replace />;
    }

    return children;
};

function AppRoutes() {
    return (
                <Routes>
            {/* 1. PUBLIC ROUTES */}
            <Route element={<ShopLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/contact" element={<Contact />} />
            </Route>

            {/* 2. CUSTOMER ROUTES (Protected but not Admin) */}
            <Route element={<ProtectedRoute><ShopLayout /></ProtectedRoute>}>
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/account" element={<Account />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/checkout" element={<Checkout />} />
            </Route>

            {/* 3. AUTH ROUTES */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* 4. ADMIN ROUTES (Nested) */}
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="revenue" element={<Revenue />} />
                <Route path="users" element={<Users />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="manufacturers" element={<Manufacturers />} />
                <Route path="specification-attributes" element={<SpecificationAttributes />} />
                <Route path="checkout-attributes" element={<CheckoutAttributes />} />
                <Route path="current-carts" element={<CurrentCarts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="payments" element={<Payments />} />
            </Route>

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    // Thứ tự Provider quan trọng: Cart/Favorite cần Auth, còn mọi màn hình đều có thể dùng Toast/Theme/Settings.
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <SettingsProvider>
                    <ThemeProvider>
                        <ToastProvider>
                            <AuthProvider>
                                <CartProvider>
                                    <FavoriteProvider>
                                        <ErrorBoundary>
                                            <Suspense fallback={<div className="route-loading skeleton-block" aria-label="Đang tải trang"></div>}>
                                                <AppRoutes />
                                            </Suspense>
                                        </ErrorBoundary>
                                    </FavoriteProvider>
                                </CartProvider>
                            </AuthProvider>
                        </ToastProvider>
                    </ThemeProvider>
                </SettingsProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
