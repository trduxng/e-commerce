import React, { useState, useEffect } from 'react';
import { roleApi } from '../services/api';

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loadingPerms, setLoadingPermissions] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const response = await roleApi.getAll();
            setRoles(response.data || []);
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setLoadingPermissions(true);
        try {
            const response = await roleApi.getPermissions(role.id);
            setPermissions(response.data?.permissions || []);
        } catch (error) {
            console.error('Failed to load permissions:', error);
            setPermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">System Roles & Functions</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-5">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Roles</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Role Name</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roles.map(role => (
                                                    <tr 
                                                        key={role.id} 
                                                        onClick={() => handleSelectRole(role)}
                                                        style={{ cursor: 'pointer' }}
                                                        className={selectedRole?.id === role.id ? 'table-primary' : ''}
                                                    >
                                                        <td><strong>{role.name}</strong></td>
                                                        <td>{role.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-7">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        {selectedRole ? `Permissions for ${selectedRole.name}` : 'Select a role to view permissions'}
                                    </h3>
                                </div>
                                <div className="card-body">
                                    {loadingPerms ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : selectedRole ? (
                                        <div className="row">
                                            {permissions.length > 0 ? (
                                                permissions.map(perm => (
                                                    <div key={perm} className="col-sm-6 col-md-4 mb-2">
                                                        <div className="custom-control custom-checkbox">
                                                            <input 
                                                                type="checkbox" 
                                                                className="custom-control-input" 
                                                                id={perm} 
                                                                checked 
                                                                readOnly 
                                                            />
                                                            <label className="custom-control-label" htmlFor={perm}>
                                                                {perm}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-12 text-center text-muted py-4">
                                                    No permissions defined for this role.
                                                </div>
                                            )}
                                            <div className="col-12 mt-4 border-top pt-3">
                                                <button 
                                                    className="btn btn-primary" 
                                                    onClick={() => alert('Feature "Modify Permissions" is in development.')}
                                                >
                                                    <i className="fas fa-save mr-1"></i> Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            <i className="fas fa-user-shield fa-3x mb-3"></i>
                                            <p>Choose a role from the left list to manage its functions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Roles;
