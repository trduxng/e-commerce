import React, { useState, useEffect } from 'react';
import { settingApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

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

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await settingApi.get();
                setSettings(response.data);
            } catch (error) {
                toast.error('Failed to load settings');
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settingApi.update(settings);
            toast.success('Settings updated successfully!');
            // Refresh to apply changes if any public components rely on window reload, 
            // but ideally they should use a context. For now, a toast is good.
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="content-wrapper p-4 text-center">Loading settings...</div>;
    }

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <h1 className="m-0">Store Settings</h1>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <form onSubmit={handleSave}>
                            <div className="card-body">
                                <h5 className="mb-3">General Settings</h5>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Store Name</label>
                                        <input className="form-control" name="storeName" value={settings.storeName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Logo URL</label>
                                        <input className="form-control" name="logoUrl" value={settings.logoUrl} onChange={handleChange} placeholder="/img/logo.png or http..." />
                                    </div>
                                </div>
                                
                                <h5 className="mb-3 mt-4">Contact Information</h5>
                                <div className="row">
                                    <div className="col-md-6 form-group">
                                        <label>Support Email</label>
                                        <input type="email" className="form-control" name="contactEmail" value={settings.contactEmail} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 form-group">
                                        <label>Phone Number</label>
                                        <input className="form-control" name="contactPhone" value={settings.contactPhone} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Physical Address</label>
                                        <input className="form-control" name="address" value={settings.address} onChange={handleChange} required />
                                    </div>
                                </div>

                                <h5 className="mb-3 mt-4">Social Links</h5>
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
                                    {saving ? 'Saving...' : 'Save Settings'}
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
