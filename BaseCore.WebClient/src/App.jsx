import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ShopLayout from './components/ShopLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Revenue from './pages/Revenue';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';

const adminPaths = ['/dashboard', '/products', '/categories', '/orders', '/revenue', '/users'];
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
                    <span className="sr-only">Loading...</span>
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
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/products"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <MainLayout>
                            <Products />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/categories"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <MainLayout>
                            <Categories />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <MainLayout>
                            <Orders />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/revenue"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <MainLayout>
                            <Revenue />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/users"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <MainLayout>
                            <Users />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AppRoutes />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
