import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;
    const adminPaths = ['/dashboard', '/products', '/categories', '/orders', '/revenue', '/users'];
    const isAdminPath = (path) => adminPaths.some((adminPath) => path === adminPath || path.startsWith(`${adminPath}/`));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            const userIsAdmin = String(result.user?.role || '').toLowerCase() === 'admin';
            const targetUrl = safeReturnUrl && (userIsAdmin || !isAdminPath(safeReturnUrl))
                ? safeReturnUrl
                : (userIsAdmin ? '/dashboard' : '/');
            navigate(targetUrl);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh' }}>
            <div className="login-box">
                <div className="login-logo">
                    <Link to="/">BaseCore Sales</Link>
                </div>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Sign in to start your session</p>

                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show">
                                <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <div className="input-group-text">
                                    <span className="fas fa-user"></span>
                                </div>
                            </div>
                            <div className="input-group mb-3">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="input-group-text">
                                    <span className="fas fa-lock"></span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-8">
                                    <div className="icheck-primary">
                                        <input type="checkbox" id="remember" />
                                        <label htmlFor="remember">Remember Me</label>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                        ) : 'Sign In'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <p className="mb-0 mt-3">
                            <Link to={`/register${safeReturnUrl ? `?returnUrl=${encodeURIComponent(safeReturnUrl)}` : ''}`}>Create a new account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
