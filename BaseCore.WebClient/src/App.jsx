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

const queryClient = new QueryClient();
const adminPaths = ['/dashboard', '/products', '/categories', '/orders', '/revenue', '/users', '/reviews', '/coupons', '/manufacturers', '/specification-attributes', '/checkout-attributes', '/current-carts', '/settings'];
const isAdminPath = (path) => adminPaths.some((adminPath) => path === adminPath || path.startsWith(`${adminPath}/`));

// Wrapper to redirect authenticated users away from login
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();
    const location = useLocation();
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
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
            {/* Shop Routes - Public */}
            <Route
                path="/"
                element={
                    <ShopLayout>
                        <Home />
                    </ShopLayout>
                }
            />
            <Route
                path="/shop"
                element={
                    <ShopLayout>
                        <Shop />
                    </ShopLayout>
                }
            />
            <Route
                path="/cart"
                element={
                    <ShopLayout>
                        <Cart />
                    </ShopLayout>
                }
            />
            <Route
                path="/favorites"
                element={
                    <ProtectedRoute>
                        <ShopLayout>
                            <Favorites />
                        </ShopLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/account"
                element={
                    <ProtectedRoute>
                        <ShopLayout>
                            <Account />
                        </ShopLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my-orders"
                element={
                    <ProtectedRoute>
                        <ShopLayout>
                            <MyOrders />
                        </ShopLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/product/:id"
                element={
                    <ShopLayout>
                        <ProductDetail />
                    </ShopLayout>
                }
            />
            <Route
                path="/checkout"
                element={
                    <ProtectedRoute>
                        <ShopLayout>
                            <Checkout />
                        </ShopLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/contact"
                element={
                    <ShopLayout>
                        <Contact />
                    </ShopLayout>
                }
            />

            {/* Admin Dashboard Routes */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Dashboard />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/products"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Products />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/categories"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Categories />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Orders />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/revenue"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Revenue />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/users"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Users />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reviews"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Reviews />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/coupons"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Coupons />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/manufacturers"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Manufacturers />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/specification-attributes"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <SpecificationAttributes />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/checkout-attributes"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <CheckoutAttributes />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/current-carts"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <CurrentCarts />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout>
                            <Settings />
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
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
                                            <Suspense fallback={<div className="route-loading skeleton-block" aria-label="Loading page"></div>}>
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
