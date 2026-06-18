import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { accountApi, addressApi } from "../services/api";
import { formatCurrency, getApiErrorMessage } from "../data/shopData";

const emptyAddress = {
  receiverName: "", phone: "", addressDetail: "", ward: "", district: "", province: "", isDefault: false,
};

const accountTabLabels = {
  dashboard: "Tổng quan",
  profile: "Thông tin cá nhân",
  addresses: "Sổ địa chỉ",
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
      toast.error("Không thể tải thông tin tài khoản.");
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
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật thông tin cá nhân."));
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
      toast.success(editingAddressId ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ mới.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu địa chỉ."));
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
      toast.success("Đã xóa địa chỉ.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa địa chỉ."));
    } finally {
      setDeleteAddressId(null);
    }
  };

  if (loading) return <div className="account-loading skeleton-block" aria-label="Đang tải tài khoản"></div>;

  return (
    <main className="container-fluid account-page pb-5">
      <div className="row px-xl-5">
        <div className="col-12">
          <nav className="breadcrumb bg-light mb-30">
            <Link className="breadcrumb-item text-dark" to="/">Trang chủ</Link>
            <span className="breadcrumb-item active">Tài khoản của tôi</span>
          </nav>
        </div>
        <aside className="col-lg-3 mb-4">
          <div className="account-nav">
            {["dashboard", "profile", "addresses"].map((tab) => (
              <button key={tab} className={activeTab === tab ? "is-active" : ""} type="button" onClick={() => setActiveTab(tab)}>
                {accountTabLabels[tab]}
              </button>
            ))}
            <Link to="/my-orders">Lịch sử đơn hàng</Link>
            <Link to="/favorites">Danh sách yêu thích</Link>
          </div>
        </aside>
        <section className="col-lg-9">
          {activeTab === "dashboard" && (
            <div>
              <h2>Tổng quan tài khoản</h2>
              <div className="row">
                {[
                  ["Đơn hàng", dashboard.totalOrders, "fa-receipt"],
                  ["Tổng chi tiêu", formatCurrency(dashboard.totalSpent), "fa-wallet"],
                  ["Sản phẩm yêu thích", dashboard.favoriteProducts, "fa-heart"],
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
              <h2>Thông tin cá nhân</h2>
              {[
                ["name", "Họ và tên", "text"],
                ["email", "Email", "email"],
                ["phone", "Số điện thoại", "tel"],
                ["avatarUrl", "Đường dẫn ảnh đại diện", "url"],
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
                        placeholder="/img/avatar.png hoặc đường dẫn tùy chỉnh"
                      />
                      <div className="input-group-append">
                        <label className="btn btn-secondary m-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                          Chọn ảnh...
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
              <button className="btn btn-primary" disabled={saving}>Lưu thông tin</button>
            </form>
          )}
          {activeTab === "addresses" && (
            <div>
              <form className="account-panel" onSubmit={saveAddress}>
                <h2>{editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ"}</h2>
                <div className="row">
                  {[
                    ["receiverName", "Tên người nhận"], ["phone", "Số điện thoại"], ["addressDetail", "Địa chỉ chi tiết"],
                    ["ward", "Phường/Xã"], ["district", "Quận/Huyện"], ["province", "Tỉnh/Thành phố"],
                  ].map(([name, label]) => (
                    <label key={name} className="col-md-6">{label}<input className="form-control" value={addressForm[name]} onChange={(event) => setAddressForm((current) => ({ ...current, [name]: event.target.value }))} required /></label>
                  ))}
                </div>
                <label className="account-checkbox"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} /> Đặt làm địa chỉ mặc định</label>
                <button className="btn btn-primary me-2" disabled={saving}>Lưu địa chỉ</button>
                {editingAddressId && <button className="btn btn-outline-dark" type="button" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }}>Hủy</button>}
              </form>
              <div className="account-address-grid">
                {addresses.map((address) => (
                  <article className="account-address" key={address.id}>
                    <strong>{address.receiverName} {address.isDefault && <small>Mặc định</small>}</strong>
                    <span>{address.phone}</span>
                    <p>{[address.addressDetail, address.ward, address.district, address.province].join(", ")}</p>
                    <button className="btn btn-sm btn-outline-primary me-2" type="button" onClick={() => editAddress(address)}>Chỉnh sửa</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeleteAddressId(address.id)}>Xóa</button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <ConfirmModal isOpen={Boolean(deleteAddressId)} title="Xóa địa chỉ" message="Bạn có chắc muốn xóa địa chỉ giao hàng đã lưu này không?" onConfirm={deleteAddress} onCancel={() => setDeleteAddressId(null)} />
    </main>
  );
};

export default Account;
