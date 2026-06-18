import React, { useState, useEffect } from 'react';
import { settingApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
    const [settings, setSettings] = useState({
        storeName: '',
        logoUrl: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        facebookLink: '',
        twitterLink: '',
        instagramLink: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const { reloadSettings } = useSettings();

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await settingApi.get();
                setSettings(response.data);
            } catch (error) {
                toast.error('Tải cài đặt thất bại');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    // Lưu cấu hình cửa hàng rồi yêu cầu SettingsContext tải lại cho toàn bộ website.
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settingApi.update(settings);
            toast.success('Cập nhật cài đặt thành công!');
            if (reloadSettings) {
                await reloadSettings();
            }
        } catch (error) {
            toast.error('Cập nhật cài đặt thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="content-wrapper p-4 text-center">Đang tải cài đặt...</div>;
    }

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <h1 className="m-0">Cài đặt cửa hàng</h1>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <form onSubmit={handleSave}>
                            <div className="card-body">
                                <h5 className="mb-3">Cài đặt chung</h5>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Tên cửa hàng</label>
                                        <input className="form-control" name="storeName" value={settings.storeName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Đường dẫn Logo</label>
                                        <div className="input-group">
                                            <input 
                                                className="form-control" 
                                                name="logoUrl" 
                                                value={settings.logoUrl} 
                                                onChange={handleChange} 
                                                placeholder="/img/logo.png hoặc URL tùy chỉnh" 
                                            />
                                            <div className="input-group-append">
                                                <label className="btn btn-secondary m-0 d-flex align-items-center">
                                                    Duyệt...
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        style={{ display: 'none' }} 
                                                        onChange={e => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setSettings(prev => ({ ...prev, logoUrl: `/img/${file.name}` }));
                                                            }
                                                        }} 
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <h5 className="mb-3 mt-4">Thông tin liên hệ</h5>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Email hỗ trợ</label>
                                        <input type="email" className="form-control" name="contactEmail" value={settings.contactEmail} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Số điện thoại</label>
                                        <input className="form-control" name="contactPhone" value={settings.contactPhone} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Địa chỉ</label>
                                        <input className="form-control" name="address" value={settings.address} onChange={handleChange} required />
                                    </div>
                                </div>

                                <h5 className="mb-3 mt-4">Liên kết Mạng xã hội</h5>
                                <div className="row">
                                    <div className="col-md-4 form-group">
                                        <label>Facebook</label>
                                        <input className="form-control" name="facebookLink" value={settings.facebookLink} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Twitter</label>
                                        <input className="form-control" name="twitterLink" value={settings.twitterLink} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Instagram</label>
                                        <input className="form-control" name="instagramLink" value={settings.instagramLink} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Đang lưu...' : 'Lưu Cài đặt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
