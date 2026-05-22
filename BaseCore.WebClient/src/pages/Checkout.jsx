import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { cartApi } from "../services/api";
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

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, reloadCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const loadingToastRef = useRef(null);
  const [billingData, setBillingData] = useState({
    firstName: user?.name || "",
    lastName: "",
    email: user?.email || "",
    phone: user?.phone || "",
    address1: "",
    address2: "",
    country: "Vietnam",
    city: "",
    state: "",
    zipCode: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedShipping = useMemo(
    () => shippingOptions.find((option) => option.id === shippingMethod) || shippingOptions[0],
    [shippingMethod]
  );
  const shippingFee = items.length > 0 ? selectedShipping.fee : 0;
  const total = subtotal + shippingFee;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const receiverName = `${billingData.firstName} ${billingData.lastName}`.trim();
  const addressPreview = [
    billingData.address1,
    billingData.address2,
    billingData.city,
    billingData.state,
    billingData.country,
  ]
    .filter(Boolean)
    .join(", ");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBillingData((current) => ({ ...current, [name]: value }));
  };

  const handleVoucher = () => {
    const message = voucherCode.trim()
      ? "Voucher code saved. Discount validation can be connected to the API."
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

    setSubmitting(true);
    loadingToastRef.current = toast.loading("Placing your order...");
    const payload = {
      receiverName,
      email: billingData.email,
      receiverPhone: billingData.phone,
      shippingAddress: addressPreview,
      paymentMethod,
      note: billingData.note,
      shippingFee,
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
                  <span>{billingData.phone || "Phone number"}</span>
                </div>
                <p>{addressPreview || "Enter your delivery address below."}</p>
              </div>

              <div className="row">
                {[
                  ["firstName", "First Name", "Nguyen", "text"],
                  ["lastName", "Last Name", "Van A", "text"],
                  ["email", "E-mail", "example@email.com", "email"],
                  ["phone", "Mobile No", "+84 909 123 456", "text"],
                  ["address1", "Address Line 1", "123 Street", "text"],
                  ["address2", "Address Line 2", "Apartment, suite, unit", "text"],
                  ["city", "City", "Ho Chi Minh City", "text"],
                  ["state", "State", "District 1", "text"],
                  ["zipCode", "ZIP Code", "700000", "text"],
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
                      required={["firstName", "email", "phone", "address1", "city"].includes(name)}
                    />
                  </div>
                ))}

                <div className="col-md-6 form-group">
                  <label>Country</label>
                  <select className="form-select" name="country" value={billingData.country} onChange={handleInputChange}>
                    <option>Vietnam</option>
                    <option>United States</option>
                    <option>Japan</option>
                    <option>Singapore</option>
                  </select>
                </div>
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
