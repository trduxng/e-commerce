import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Search states
    const [searchEmail, setSearchEmail] = useState('');
    const [searchUsername, setSearchUsername] = useState('');
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchCompany, setSearchCompany] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchZipPostalCode, setSearchZipPostalCode] = useState('');
    const [searchIpAddress, setSearchIpAddress] = useState('');
    const [searchIsActive, setSearchIsActive] = useState('0'); // 0: All, 1: Active, 2: Inactive
    const [searchRegistrationDateFrom, setSearchRegistrationDateFrom] = useState('');
    const [searchRegistrationDateTo, setSearchRegistrationDateTo] = useState('');
    const [selectedCustomerRoleIds, setSelectedCustomerRoleIds] = useState([]); // 1: Admin, 2: Staff, 0: Customer
    
    // Sort states
    const [sortField, setSortField] = useState('created');
    const [sortDir, setSortDir] = useState('desc');
    
    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    
    // UI states
    const [isSearchOpen, setIsSearchOpen] = useState(true);

    useEffect(() => {
        loadUsers();
    }, [page, pageSize]);

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

            if (selectedCustomerRoleIds && selectedCustomerRoleIds.length > 0) {
                selectedCustomerRoleIds.forEach(id => {
                    params.append('userType', id);
                });
            }

            const response = await userApi.getAll(params);
            setUsers(response.data.data || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalCount(response.data.totalCount || 0);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleRoleChange = (e) => {
        const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setSelectedCustomerRoleIds(values);
    };

    const getRoleName = (userType) => {
        switch (userType) {
            case 1: return 'Administrators';
            case 2: return 'Staff';
            default: return 'Registered';
        }
    };

    return (
        <form onSubmit={handleSearch}>
            <div className="content-header clearfix">
                <h1 className="float-left">
                    Customers
                </h1>
                <div className="float-right">
                    <button type="button" className="btn btn-primary" onClick={() => alert('Navigate to Add User')}>
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
                                                        <input type="text" className="form-control text-box single-line" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Username</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">First name</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchFirstName} onChange={(e) => setSearchFirstName(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Last name</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchLastName} onChange={(e) => setSearchLastName(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Active</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" value={searchIsActive} onChange={(e) => setSearchIsActive(e.target.value)}>
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
                                                        <input type="date" className="form-control" value={searchRegistrationDateFrom} onChange={(e) => setSearchRegistrationDateFrom(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Registration date to</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="date" className="form-control" value={searchRegistrationDateTo} onChange={(e) => setSearchRegistrationDateTo(e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-7">
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Company</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchCompany} onChange={(e) => setSearchCompany(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Phone</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Zip / postal code</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchZipPostalCode} onChange={(e) => setSearchZipPostalCode(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">IP address</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <input type="text" className="form-control text-box single-line" value={searchIpAddress} onChange={(e) => setSearchIpAddress(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Customer roles</label>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <select className="form-control" multiple value={selectedCustomerRoleIds} onChange={handleRoleChange} style={{ height: '100px' }}>
                                                            <option value={1}>Administrators</option>
                                                            <option value={2}>Staff</option>
                                                            <option value={0}>Registered</option>
                                                        </select>
                                                        <small className="form-text text-muted">Hold Ctrl to select multiple roles</small>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-md-4">
                                                        <label className="col-form-label">Sort by</label>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                                                            <option value="created">Registration date</option>
                                                            <option value="name">Name</option>
                                                            <option value="email">Email</option>
                                                            <option value="role">Role</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <select className="form-control" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                                                            <option value="desc">Descending</option>
                                                            <option value="asc">Ascending</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="text-center col-12">
                                                <button type="button" onClick={handleSearch} disabled={loading} className="btn btn-primary btn-search">
                                                    {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-search mr-1"></i>}
                                                    Search
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card card-default">
                                <div className="card-body">
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
                                                            <th className="text-center" style={{ width: '80px' }}>Edit</th>
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
                                                                        <button type="button" className="btn btn-default" disabled={loading} onClick={() => alert('Edit User ' + user.id)}>
                                                                            <i className="fas fa-pencil-alt"></i>
                                                                            {' '}Edit
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
                                                                <button type="button" className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                                                            </li>
                                                            {[...Array(totalPages)].map((_, i) => (
                                                                <li key={i + 1} className={`paginate_button page-item ${page === i + 1 ? 'active' : ''}`}>
                                                                    <button type="button" className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                                                </li>
                                                            ))}
                                                            <li className={`paginate_button page-item next ${page === totalPages ? 'disabled' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
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
        </form>
    );
};

export default Users;
