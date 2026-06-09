import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { addressApi, cartApi } from "../services/api";
import { formatCurrency } from "../data/shopData";

const shippingOptions = [
  {
    id: "standard",
    title: "Standard Delivery",
    description: "Receive in 2-4 business days",
    fee: 30000,
    icon: "fa-truck-fast",
  },
  {
    id: "express",
    title: "Express Delivery",
    description: "Receive in 1-2 business days",
    fee: 55000,
    icon: "fa-bolt",
  },
  {
    id: "pickup",
    title: "Store Pickup",
    description: "Pick up at BaseShop counter",
    fee: 0,
    icon: "fa-store",
  },
];

const paymentOptions = [
  ["cod", "Cash on Delivery", "Pay when the package arrives", "fa-money-bill-wave"],
  ["banktransfer", "Bank Transfer", "Transfer after order confirmation", "fa-building-columns"],
  ["paypal", "Paypal", "Pay securely with Paypal", "fa-wallet"],
];

const createInitialBillingData = (user = {}) => ({
  receiverName: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  addressDetail: "",
  ward: "",
  district: "",
  province: "",
  note: "",
  isDefault: false,
});

const getAddressText = (address = {}) =>
  [
    address.addressDetail,
    address.ward,
    address.district,
    address.province,
  ]
    .filter(Boolean)
    .join(", ");

const sortAddresses = (addresses) =>
  [...addresses].sort((first, second) => Number(second.isDefault) - Number(first.isDefault));

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, reloadCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const loadingToastRef = useRef(null);
  const [billingData, setBillingData] = useState(() => createInitialBillingData(user));
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [addressMode, setAddressMode] = useState("new");
  const [addressLoading, setAddressLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBillingData((current) => ({
      ...current,
      receiverName: current.receiverName || user?.name || "",
      email: current.email || user?.email || "",
      phone: current.phone || user?.phone || "",
    }));
  }, [user?.name, user?.email, user?.phone]);

  useEffect(() => {
    let isMounted = true;

    const loadAddresses = async () => {
      if (!user) {
        setSavedAddresses([]);
        setSelectedAddressId("new");
        setAddressMode("new");
        return;
      }

      setAddressLoading(true);
      try {
        const response = await addressApi.getMyAddresses();
        if (!isMounted) return;

        const addresses = sortAddresses(Array.isArray(response.data) ? response.data : []);
        setSavedAddresses(addresses);

        const preferredAddress = addresses.find((address) => address.isDefault) || addresses[0];
        if (preferredAddress) {
          setSelectedAddressId(String(preferredAddress.id));
          setAddressMode("saved");
        } else {
          setSelectedAddressId("new");
          setAddressMode("new");
        }
      } catch {
        if (!isMounted) return;
        setSavedAddresses([]);
        setSelectedAddressId("new");
        setAddressMode("new");
      } finally {
        if (isMounted) {
          setAddressLoading(false);
        }
      }
    };

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [user?.userId, user?.id, user?.username, user?.email]);

  const selectedShipping = useMemo(
    () => shippingOptions.find((option) => option.id === shippingMethod) || shippingOptions[0],
    [shippingMethod]
  );
  const shippingFee = items.length > 0 ? selectedShipping.fee : 0;
  const total = subtotal + shippingFee;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const selectedAddress = savedAddresses.find((address) => String(address.id) === String(selectedAddressId));
  const activeAddress = addressMode === "saved" && selectedAddress ? selectedAddress : billingData;
  const receiverName = activeAddress.receiverName?.trim() || "";
  const receiverPhone = activeAddress.phone?.trim() || "";
  const addressPreview = getAddressText(activeAddress);

  const handleInputChange = (event) => {
    const { checked, name, type, value } = event.target;
    setBillingData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSelectSavedAddress = (addressId) => {
    setSelectedAddressId(String(addressId));
    setAddressMode("saved");
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId("new");
    setAddressMode("new");
  };

  const buildAddressDto = () => ({
    receiverName: billingData.receiverName,
    phone: billingData.phone,
    province: billingData.province,
    district: billingData.district,
    ward: billingData.ward,
    addressDetail: billingData.addressDetail,
    isDefault: billingData.isDefault,
  });

  const validateAddress = (address) => {
    if (!address.receiverName?.trim()) return "Receiver name is required.";
    if (!address.phone?.trim()) return "Phone number is required.";
    if (!address.addressDetail?.trim()) return "Address detail is required.";
    if (!address.ward?.trim()) return "Ward is required.";
    if (!address.district?.trim()) return "District is required.";
    if (!address.province?.trim()) return "Province is required.";
    return null;
  };

  const handleSaveAddress = async () => {
    const dto = buildAddressDto();
    const validationMessage = validateAddress(dto);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setSavingAddress(true);
    try {
      const response = await addressApi.create(dto);
      const createdAddress = response.data;
      const nextAddresses = dto.isDefault || savedAddresses.length === 0
        ? savedAddresses.map((address) => ({ ...address, isDefault: false }))
        : savedAddresses;

      setSavedAddresses(sortAddresses([createdAddress, ...nextAddresses]));
      setSelectedAddressId(String(createdAddress.id));
      setAddressMode("saved");
      setBillingData((current) => ({ ...current, isDefault: false }));
      toast.success("Address saved.");
    } catch (error) {
      const responseData = error.response?.data;
      const message = typeof responseData === "string" ? responseData : responseData?.message;
      toast.error(message || "Address could not be saved.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await addressApi.setDefault(addressId);
      setSavedAddresses((current) =>
        sortAddresses(current.map((address) => ({ ...address, isDefault: String(address.id) === String(addressId) })))
      );
      setSelectedAddressId(String(addressId));
      setAddressMode("saved");
      toast.success("Default address updated.");
    } catch (error) {
      const responseData = error.response?.data;
      const message = typeof responseData === "string" ? responseData : responseData?.message;
      toast.error(message || "Default address could not be updated.");
    }
  };

  const handleVoucher = () => {
    const message = voucherCode.trim()
      ? "This voucher is not available. Only validated vouchers can change the order total."
      : "Enter a voucher code first.";
    setVoucherMessage(message);
    if (voucherCode.trim()) {
      toast.info(message);
    } else {
      toast.warning(message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.warning("Your cart is empty.");
      return;
    }

    const validationMessage = validateAddress(activeAddress);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setSubmitting(true);
    loadingToastRef.current = toast.loading("Placing your order...");
    const payload = {
      receiverName,
      email: billingData.email,
      receiverPhone,
      shippingAddress: addressPreview,
      paymentMethod,
      note: billingData.note,
      shippingMethod,
    };

    try {
      const response = await cartApi.checkout(payload);
      const orderId = response.data?.order?.id || response.data?.id;
      await reloadCart();
      if (loadingToastRef.current) {
        toast.dismissToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      toast.success("Order placed successfully.");
      navigate(orderId ? `/my-orders?orderId=${orderId}&success=1` : "/my-orders?success=1");
    } catch (error) {
      const responseData = error.response?.data;
      const detail = typeof responseData === "string"
        ? responseData.slice(0, 240)
        : responseData?.message;
      if (loadingToastRef.current) {
        toast.dismissToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      toast.error(detail || "Order could not be submitted. Please check the API or sign in and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getItemKey = (item, index) =>
    item.productVariantId ?? item.cartItemId ?? item.id ?? `${item.name}-${index}`;

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Shop</Link>
              <span className="breadcrumb-item active">Checkout</span>
            </nav>
          </div>
        </div>
      </div>

      <form className="container-fluid checkout-page" onSubmit={handleSubmit}>
        <div className="row px-xl-5">
          <div className="col-lg-8">
            <div className="checkout-panel checkout-address-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Delivery</span>
                  <h4>Delivery Address</h4>
                </div>
                <i className="fa fa-location-dot"></i>
              </div>

              <div className="checkout-address-preview">
                <div>
                  <strong>{receiverName || "Receiver name"}</strong>
                  <span>{receiverPhone || "Phone number"}</span>
                </div>
                <p>{addressPreview || "Enter your delivery address below."}</p>
              </div>

              <div className="checkout-address-actions">
                <button
                  className={`btn btn-sm ${addressMode === "new" ? "btn-primary" : "btn-outline-primary"}`}
                  type="button"
                  onClick={handleUseNewAddress}
                >
                  <i className="fa fa-plus mr-2"></i>
                  Add New Address
                </button>
              </div>

              {addressLoading ? (
                <div className="checkout-address-loading">Loading saved addresses...</div>
              ) : savedAddresses.length > 0 && (
                <div className="checkout-address-book">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`checkout-saved-address ${addressMode === "saved" && String(selectedAddressId) === String(address.id) ? "is-selected" : ""}`}
                    >
                      <label htmlFor={`address-${address.id}`}>
                        <input
                          type="radio"
                          id={`address-${address.id}`}
                          name="savedAddress"
                          checked={addressMode === "saved" && String(selectedAddressId) === String(address.id)}
                          onChange={() => handleSelectSavedAddress(address.id)}
                        />
                        <span>
                          <strong>{address.receiverName}</strong>
                          {address.isDefault && <small>Default</small>}
                          <em>{address.phone}</em>
                          <p>{getAddressText(address)}</p>
                        </span>
                      </label>
                      {!address.isDefault && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => handleSetDefaultAddress(address.id)}
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="row">
                <div className="col-md-6 form-group">
                  <label>E-mail</label>
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={billingData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {addressMode === "new" && (
                  <>
                    {[
                      ["receiverName", "Receiver Name", "Nguyen Van A", "text"],
                      ["phone", "Mobile No", "+84 909 123 456", "text"],
                      ["addressDetail", "Address Detail", "123 Street, apartment, suite", "text"],
                      ["ward", "Ward", "Ben Nghe", "text"],
                      ["district", "District", "District 1", "text"],
                      ["province", "Province/City", "Ho Chi Minh City", "text"],
                    ].map(([name, label, placeholder, type]) => (
                      <div key={name} className="col-md-6 form-group">
                        <label>{label}</label>
                        <input
                          className="form-control"
                          type={type}
                          name={name}
                          placeholder={placeholder}
                          value={billingData[name]}
                          onChange={handleInputChange}
                          required={addressMode === "new"}
                        />
                      </div>
                    ))}

                    <div className="col-md-12">
                      <div className="checkout-save-address">
                        <label htmlFor="isDefaultAddress">
                          <input
                            type="checkbox"
                            id="isDefaultAddress"
                            name="isDefault"
                            checked={billingData.isDefault}
                            onChange={handleInputChange}
                          />
                          <span>Set as default delivery address</span>
                        </label>
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={handleSaveAddress}
                          disabled={savingAddress}
                        >
                          {savingAddress ? "Saving..." : "Save Address"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="col-md-12 form-group mb-0">
                  <label>Order Note</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="note"
                    placeholder="Delivery instructions"
                    value={billingData.note}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Order</span>
                  <h4>Products Ordered</h4>
                </div>
                <span className="checkout-count">{itemCount} items</span>
              </div>

              {items.length === 0 ? (
                <div className="checkout-empty">
                  <h5>Your cart is empty</h5>
                  <p>Add products before checkout.</p>
                  <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
                </div>
              ) : (
                <div className="checkout-items">
                  {items.map((item, index) => (
                    <div key={getItemKey(item, index)} className="checkout-item">
                      <img src={item.imageUrl || "/img/product-1.jpg"} alt={item.name} />
                      <div className="checkout-item-info">
                        <h6>{item.name}</h6>
                        {(item.size || item.color) && (
                          <small>
                            {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                              .filter(Boolean)
                              .join(" | ")}
                          </small>
                        )}
                      </div>
                      <div className="checkout-item-price">{formatCurrency(item.price)}</div>
                      <div className="checkout-item-qty">x{item.quantity}</div>
                      <div className="checkout-item-total">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Shipping</span>
                  <h4>Shipping Option</h4>
                </div>
              </div>

              <div className="checkout-option-grid">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`checkout-option ${shippingMethod === option.id ? "is-selected" : ""}`}
                    onClick={() => setShippingMethod(option.id)}
                  >
                    <i className={`fa ${option.icon}`}></i>
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                    <b>{formatCurrency(option.fee)}</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Payment</span>
                  <h4>Payment Method</h4>
                </div>
              </div>

              <div className="checkout-option-grid payment-grid">
                {paymentOptions.map(([value, label, description, icon]) => (
                  <label
                    key={value}
                    className={`checkout-option ${paymentMethod === value ? "is-selected" : ""}`}
                    htmlFor={`payment-${value}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      id={`payment-${value}`}
                      value={value}
                      checked={paymentMethod === value}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                    <i className={`fa ${icon}`}></i>
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <aside className="checkout-summary">
              <div className="checkout-voucher">
                <div className="checkout-summary-title">
                  <i className="fa fa-ticket"></i>
                  Voucher
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                  />
                  <button className="btn btn-outline-primary" type="button" onClick={handleVoucher}>
                    Apply
                  </button>
                </div>
                {voucherMessage && <small>{voucherMessage}</small>}
              </div>

              <div className="checkout-summary-card">
                <div className="checkout-summary-title">
                  <i className="fa fa-receipt"></i>
                  Order Summary
                </div>

                <div className="checkout-summary-row">
                  <span>Merchandise subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="checkout-summary-row">
                  <span>Shipping fee</span>
                  <strong>{formatCurrency(shippingFee)}</strong>
                </div>
                <div className="checkout-summary-row">
                  <span>Payment method</span>
                  <strong>{paymentOptions.find(([value]) => value === paymentMethod)?.[1]}</strong>
                </div>

                <div className="checkout-summary-total">
                  <span>Total payment</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>

                <button
                  className="btn w-100 btn-primary checkout-submit"
                  type="submit"
                  disabled={submitting || items.length === 0}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>

                <p className="checkout-policy">
                  By placing your order, you agree to BaseShop processing this order and contacting you for delivery.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </>
  );
};

export default Checkout;
