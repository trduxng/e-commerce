import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { accountApi, addressApi } from "../services/api";
import { formatCurrency } from "../data/shopData";

const emptyAddress = {
  receiverName: "", phone: "", addressDetail: "", ward: "", district: "", province: "", isDefault: false,
};

const Account = () => {
  const toast = useToast();
  const { updateStoredUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({ totalOrders: 0, totalSpent: 0, favoriteProducts: 0 });
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatarUrl: "" });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, profileResponse, addressesResponse] = await Promise.all([
        accountApi.getDashboard(),
        accountApi.getProfile(),
        addressApi.getMyAddresses(),
      ]);
      setDashboard(dashboardResponse.data);
      setProfile(profileResponse.data);
      setAddresses(Array.isArray(addressesResponse.data) ? addressesResponse.data : []);
    } catch {
      toast.error("Account information could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await accountApi.updateProfile(profile);
      setProfile(response.data);
      updateStoredUser(response.data);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingAddressId) await addressApi.update(editingAddressId, addressForm);
      else await addressApi.create(addressForm);
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      setAddresses((await addressApi.getMyAddresses()).data);
      toast.success(editingAddressId ? "Address updated." : "Address created.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Address could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({ ...emptyAddress, ...address });
  };

  const deleteAddress = async () => {
    try {
      await addressApi.delete(deleteAddressId);
      setAddresses((await addressApi.getMyAddresses()).data);
      toast.success("Address deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Address could not be deleted.");
    } finally {
      setDeleteAddressId(null);
    }
  };

  if (loading) return <div className="account-loading skeleton-block" aria-label="Loading account"></div>;

  return (
    <main className="container-fluid account-page pb-5">
      <div className="row px-xl-5">
        <div className="col-12">
          <nav className="breadcrumb bg-light mb-30">
            <Link className="breadcrumb-item text-dark" to="/">Home</Link>
            <span className="breadcrumb-item active">My Account</span>
          </nav>
        </div>
        <aside className="col-lg-3 mb-4">
          <div className="account-nav">
            {["dashboard", "profile", "addresses"].map((tab) => (
              <button key={tab} className={activeTab === tab ? "is-active" : ""} type="button" onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
            <Link to="/my-orders">Order history</Link>
            <Link to="/favorites">Wishlist</Link>
          </div>
        </aside>
        <section className="col-lg-9">
          {activeTab === "dashboard" && (
            <div>
              <h2>Account Dashboard</h2>
              <div className="row">
                {[
                  ["Orders", dashboard.totalOrders, "fa-receipt"],
                  ["Total spent", formatCurrency(dashboard.totalSpent), "fa-wallet"],
                  ["Wishlist", dashboard.favoriteProducts, "fa-heart"],
                ].map(([label, value, icon]) => (
                  <div key={label} className="col-md-4 mb-3">
                    <div className="account-stat"><i className={`fa ${icon}`}></i><span>{label}</span><strong>{value}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "profile" && (
            <form className="account-panel" onSubmit={saveProfile}>
              <h2>Profile</h2>
              {[
                ["name", "Full name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["avatarUrl", "Avatar URL", "url"],
              ].map(([name, label, type]) => (
                <div key={name} className="form-group mb-3">
                  <label className="d-block mb-1">{label}</label>
                  {name === "avatarUrl" ? (
                    <div className="input-group">
                      <input 
                        className="form-control" 
                        name={name} 
                        type={type} 
                        value={profile[name] || ""} 
                        onChange={(event) => setProfile((current) => ({ ...current, [name]: event.target.value }))} 
                        placeholder="/img/avatar.png or custom URL"
                      />
                      <div className="input-group-append">
                        <label className="btn btn-secondary m-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                          Browse...
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: "none" }} 
                            onChange={(event) => {
                              const file = event.target.files[0];
                              if (file) {
                                setProfile((current) => ({ ...current, avatarUrl: `/img/${file.name}` }));
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <input className="form-control" name={name} type={type} value={profile[name] || ""} onChange={(event) => setProfile((current) => ({ ...current, [name]: event.target.value }))} required={name === "name" || name === "email"} />
                  )}
                </div>
              ))}
              <button className="btn btn-primary" disabled={saving}>Save profile</button>
            </form>
          )}
          {activeTab === "addresses" && (
            <div>
              <form className="account-panel" onSubmit={saveAddress}>
                <h2>{editingAddressId ? "Edit Address" : "Add Address"}</h2>
                <div className="row">
                  {[
                    ["receiverName", "Receiver name"], ["phone", "Phone"], ["addressDetail", "Address detail"],
                    ["ward", "Ward"], ["district", "District"], ["province", "Province/City"],
                  ].map(([name, label]) => (
                    <label key={name} className="col-md-6">{label}<input className="form-control" value={addressForm[name]} onChange={(event) => setAddressForm((current) => ({ ...current, [name]: event.target.value }))} required /></label>
                  ))}
                </div>
                <label className="account-checkbox"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} /> Set as default</label>
                <button className="btn btn-primary me-2" disabled={saving}>Save address</button>
                {editingAddressId && <button className="btn btn-outline-dark" type="button" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }}>Cancel</button>}
              </form>
              <div className="account-address-grid">
                {addresses.map((address) => (
                  <article className="account-address" key={address.id}>
                    <strong>{address.receiverName} {address.isDefault && <small>Default</small>}</strong>
                    <span>{address.phone}</span>
                    <p>{[address.addressDetail, address.ward, address.district, address.province].join(", ")}</p>
                    <button className="btn btn-sm btn-outline-primary me-2" type="button" onClick={() => editAddress(address)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeleteAddressId(address.id)}>Delete</button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <ConfirmModal isOpen={Boolean(deleteAddressId)} title="Delete address" message="Delete this saved delivery address?" onConfirm={deleteAddress} onCancel={() => setDeleteAddressId(null)} />
    </main>
  );
};

export default Account;
