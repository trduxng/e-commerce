import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';

const emptyUserForm = {
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    userType: 0,
    isActive: true,
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [searchEmail, setSearchEmail] = useState('');
    const [searchUsername, setSearchUsername] = useState('');
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchCompany, setSearchCompany] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchZipPostalCode, setSearchZipPostalCode] = useState('');
    const [searchIpAddress, setSearchIpAddress] = useState('');
    const [searchIsActive, setSearchIsActive] = useState('0');
    const [searchRegistrationDateFrom, setSearchRegistrationDateFrom] = useState('');
    const [searchRegistrationDateTo, setSearchRegistrationDateTo] = useState('');
    const [selectedCustomerRoleIds, setSelectedCustomerRoleIds] = useState([]); // 1: Admin, 2: Staff, 0: Customer

    // Sort states
    const [sortField, setSortField] = useState('created');
    const [sortDir, setSortDir] = useState('desc');

    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize] = useState(15);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [isSearchOpen, setIsSearchOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(emptyUserForm);

    useEffect(() => {
        loadUsers();
    }, [page, pageSize]);

    // Phân trang, tìm kiếm và lọc role đều được thực hiện ở backend.
    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            params.append('sortField', sortField);
            params.append('sortDir', sortDir);
            if (searchEmail) params.append('email', searchEmail);
            if (searchUsername) params.append('username', searchUsername);
            if (searchFirstName) params.append('firstName', searchFirstName);
            if (searchLastName) params.append('lastName', searchLastName);
            if (searchCompany) params.append('company', searchCompany);
            if (searchPhone) params.append('phone', searchPhone);
            if (searchZipPostalCode) params.append('zipPostalCode', searchZipPostalCode);
            if (searchIpAddress) params.append('ipAddress', searchIpAddress);
            if (searchRegistrationDateFrom) params.append('registrationFrom', searchRegistrationDateFrom);
            if (searchRegistrationDateTo) params.append('registrationTo', searchRegistrationDateTo);

            if (searchIsActive !== '0') {
                params.append('isActive', searchIsActive === '1');
            }

            selectedCustomerRoleIds.forEach((id) => {
                params.append('userType', id);
            });

            const response = await userApi.getAll(params);
            setUsers(response.data.data || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalCount(response.data.totalCount || 0);
            setError('');
        } catch (error) {
            console.error('Failed to load users:', error);
            setError(error.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        if (page === 1) {
            loadUsers();
        } else {
            setPage(1);
        }
    };

    const handleRoleChange = (event) => {
        const values = Array.from(event.target.selectedOptions, (option) => option.value);
        setSelectedCustomerRoleIds(values);
    };

    // Khi sửa không yêu cầu nhập lại mật khẩu; khi tạo mới mật khẩu là bắt buộc.
    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username || '',
                password: '',
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                position: user.position || '',
                userType: Number(user.userType) || 0,
                isActive: user.isActive !== false,
            });
        } else {
            setEditingUser(null);
            setFormData(emptyUserForm);
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError('');
    };

    // Dùng cùng form cho POST tạo user và PUT cập nhật user.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            if (editingUser) {
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    position: formData.position,
                    userType: Number(formData.userType),
                    isActive: formData.isActive,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await userApi.update(editingUser.id, updateData);
            } else {
                if (!formData.password) {
                    setError('Password is required for new user');
                    return;
                }

                await userApi.create({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    position: formData.position,
                    userType: Number(formData.userType),
                    isActive: formData.isActive,
                });
            }

            closeModal();
            loadUsers();
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userApi.delete(id);
            loadUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const getRoleName = (userType) => {
        switch (Number(userType)) {
            case 1: return 'Administrators';
            case 2: return 'Staff';
            default: return 'Registered';
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header clearfix">
                <h1 className="float-left">
                    Customers
                </h1>
                <div className="float-right">
                    <button type="button" className="btn btn-primary" onClick={() => openModal()}>
                        <i className="fas fa-plus-square"></i>
                        {' '}Add new
                    </button>
                    <div className="btn-group ml-1">
                        <button type="button" className="btn btn-success">
                            <i className="fas fa-download"></i>
                            {' '}Export
                        </button>
                        <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            <span className="caret"></span>
                            <span className="sr-only">&nbsp;</span>
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link p-0 text-left w-100 text-dark text-decoration-none">
                                    <i className="far fa-file-code mr-2"></i>Export to XML (all found)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link p-0 text-left w-100 text-dark text-decoration-none">
                                    <i className="far fa-file-code mr-2"></i>Export to XML (selected)
                                </button>
                            </li>
                            <li className="dropdown-divider"></li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link p-0 text-left w-100 text-dark text-decoration-none">
                                    <i className="far fa-file-excel mr-2"></i>Export to Excel (all found)
                                </button>
                            </li>
                            <li className="dropdown-item">
                                <button type="button" className="btn btn-link p-0 text-left w-100 text-dark text-decoration-none">
                                    <i className="far fa-file-excel mr-2"></i>Export to Excel (selected)
                                </button>
                            </li>
                        </ul>
                    </div>
                    <button type="button" className="btn bg-olive ml-1">
                        <i className="fas fa-upload"></i>
                        {' '}Import
                    </button>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="form-horizontal">
                        <div className="cards-group">
                            <form onSubmit={handleSearch}>
                                <div className="card card-default card-search">
                                    <div className="card-body">
                                        <div
                                            className={`row search-row ${isSearchOpen ? 'opened' : ''}`}
                                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="search-text">Search</div>
                                            <div className="icon-search"><i className="fas fa-search" aria-hidden="true"></i></div>
                                            <div className="icon-collapse">
                                                <i className={`fas fa-angle-${isSearchOpen ? 'up' : 'down'}`} aria-hidden="true"></i>
                                            </div>
                                        </div>

                                        <div className={`search-body ${isSearchOpen ? '' : 'd-none'}`} style={{ marginTop: '15px' }}>
                                            <div className="row">
                                                <div className="col-md-5">
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Email</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchEmail} onChange={(event) => setSearchEmail(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Username</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchUsername} onChange={(event) => setSearchUsername(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">First name</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchFirstName} onChange={(event) => setSearchFirstName(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Last name</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchLastName} onChange={(event) => setSearchLastName(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Active</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" value={searchIsActive} onChange={(event) => setSearchIsActive(event.target.value)}>
                                                                <option value="0">All</option>
                                                                <option value="1">Active only</option>
                                                                <option value="2">Inactive only</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Registration date from</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="date" className="form-control" value={searchRegistrationDateFrom} onChange={(event) => setSearchRegistrationDateFrom(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Registration date to</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="date" className="form-control" value={searchRegistrationDateTo} onChange={(event) => setSearchRegistrationDateTo(event.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-7">
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Company</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchCompany} onChange={(event) => setSearchCompany(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Phone</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchPhone} onChange={(event) => setSearchPhone(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Zip / postal code</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchZipPostalCode} onChange={(event) => setSearchZipPostalCode(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">IP address</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <input type="text" className="form-control text-box single-line" value={searchIpAddress} onChange={(event) => setSearchIpAddress(event.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <div className="col-md-4">
                                                            <label className="col-form-label">Customer roles</label>
                                                        </div>
                                                        <div className="col-md-8">
                                                            <select className="form-control" multiple value={selectedCustomerRoleIds} onChange={handleRoleChange} style={{ height: '100px' }}>
                                                                <option value="1">Administrators</option>
                                                                <option value="2">Staff</option>
                                                                <option value="0">Registered</option>
                                                            </select>
                                                            <small className="form-text text-muted">Hold Ctrl to select multiple roles</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="text-center col-12">
                                                    <button type="submit" className="btn btn-primary btn-search">
                                                        <i className="fas fa-search"></i>
                                                        {' '}Search
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>


                            <div className="card card-default">
                                <div className="card-body">
                                    {error && !showModal && <div className="alert alert-warning">{error}</div>}
                                    <div className="dataTables_wrapper dt-bootstrap4 no-footer">
                                        <div className="row">
                                            <div className="col-sm-12">
                                                <table className="table table-bordered table-hover table-striped dataTable no-footer">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-center" style={{ width: '30px' }}>
                                                                <input type="checkbox" />
                                                            </th>
                                                            <th>Email</th>
                                                            <th>Username</th>
                                                            <th>Name</th>
                                                            <th style={{ width: '150px' }}>Customer roles</th>
                                                            <th>Company</th>
                                                            <th>Phone</th>
                                                            <th>Zip / postal code</th>
                                                            <th className="text-center" style={{ width: '70px' }}>Active</th>
                                                            <th className="text-center" style={{ width: '120px' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {loading ? (
                                                            <tr>
                                                                <td colSpan="10" className="text-center">
                                                                    <div className="spinner-border text-primary" role="status">
                                                                        <span className="sr-only">Loading...</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : users.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="10" className="dataTables_empty text-center">No data available in table</td>
                                                            </tr>
                                                        ) : (
                                                            users.map((user) => (
                                                                <tr key={user.id}>
                                                                    <td className="text-center">
                                                                        <input type="checkbox" value={user.id} />
                                                                    </td>
                                                                    <td>{user.email}</td>
                                                                    <td>{user.username}</td>
                                                                    <td>{user.name}</td>
                                                                    <td>{getRoleName(user.userType)}</td>
                                                                    <td>{user.company || ''}</td>
                                                                    <td>{user.phone}</td>
                                                                    <td>{user.zipPostalCode || ''}</td>
                                                                    <td className="text-center">
                                                                        <i className={`fas ${user.isActive ? 'fa-check text-success' : 'fa-times text-danger'}`}></i>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button type="button" className="btn btn-default mr-1" disabled={loading} onClick={() => openModal(user)}>
                                                                            <i className="fas fa-pencil-alt"></i>
                                                                            {' '}Edit
                                                                        </button>
                                                                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(user.id)}>
                                                                            <i className="fas fa-trash"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {!loading && users.length > 0 && (
                                            <div className="row margin-t-5">
                                                <div className="col-sm-5">
                                                    <div className="dataTables_info">
                                                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                                                    </div>
                                                </div>
                                                <div className="col-sm-7">
                                                    <div className="dataTables_paginate paging_simple_numbers">
                                                        <ul className="pagination">
                                                            <li className={`paginate_button page-item previous ${page === 1 ? 'disabled' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
                                                            </li>
                                                            {[...Array(totalPages)].map((_, index) => (
                                                                <li key={index + 1} className={`paginate_button page-item ${page === index + 1 ? 'active' : ''}`}>
                                                                    <button type="button" className="page-link" onClick={() => setPage(index + 1)}>{index + 1}</button>
                                                                </li>
                                                            ))}
                                                            <li className={`paginate_button page-item next ${page === totalPages ? 'disabled' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingUser ? 'Edit User' : 'Add User'}
                                </h5>
                                <button type="button" className="close" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.username}
                                            onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password {editingUser && '(leave blank to keep current)'}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={formData.password}
                                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={formData.email}
                                            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.phone}
                                            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Position</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.position}
                                            onChange={(event) => setFormData({ ...formData, position: event.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select
                                            className="form-control"
                                            value={formData.userType}
                                            onChange={(event) => setFormData({ ...formData, userType: Number(event.target.value) })}
                                        >
                                            <option value="0">User</option>
                                            <option value="1">Admin</option>
                                            <option value="2">Staff</option>
                                        </select>
                                    </div>
                                    {editingUser && (
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="user-is-active"
                                                    checked={formData.isActive}
                                                    onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                                                />
                                                <label className="custom-control-label" htmlFor="user-is-active">Active</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default Users;
