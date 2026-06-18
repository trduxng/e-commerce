import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { register, login } = useAuth();
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    // Kiểm tra form cơ bản ở client trước khi gửi yêu cầu tạo tài khoản.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        const result = await register({
            username: formData.email,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            password: formData.password,
        });

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        const loginResult = await login(formData.email, formData.password);
        setLoading(false);

        if (loginResult.success) {
            navigate(safeReturnUrl || '/');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="login-page" style={{ minHeight: '100vh' }}>
            <div className="login-box">
                <div className="login-logo">
                    <Link to="/">BaseCore Sales</Link>
                </div>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Tạo tài khoản để mua sắm</p>

                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group mb-3">
                                <input className="form-control" name="name" placeholder="Họ và tên" value={formData.name} onChange={handleChange} required />
                                <div className="input-group-text"><span className="fas fa-user"></span></div>
                            </div>
                            <div className="input-group mb-3">
                                <input className="form-control" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                                <div className="input-group-text"><span className="fas fa-envelope"></span></div>
                            </div>
                            <div className="input-group mb-3">
                                <input className="form-control" name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} />
                                <div className="input-group-text"><span className="fas fa-phone"></span></div>
                            </div>
                            <div className="input-group mb-3">
                                <input className="form-control" type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} required minLength={6} />
                                <div className="input-group-text"><span className="fas fa-lock"></span></div>
                            </div>
                            <div className="input-group mb-3">
                                <input className="form-control" type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
                                <div className="input-group-text"><span className="fas fa-lock"></span></div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Đăng ký'}
                            </button>
                        </form>

                        <p className="mb-0 mt-3">
                            <Link to={`/login${safeReturnUrl ? `?returnUrl=${encodeURIComponent(safeReturnUrl)}` : ''}`}>Đã có tài khoản? Đăng nhập</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
