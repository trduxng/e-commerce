import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { orderApi } from "../services/api";
import { formatCurrency } from "../data/shopData";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const [billingData, setBillingData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    country: "Vietnam",
    city: "",
    state: "",
    zipCode: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBillingData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const payload = {
      customerName: `${billingData.firstName} ${billingData.lastName}`.trim(),
      email: billingData.email,
      phone: billingData.phone,
      address: [billingData.address1, billingData.address2, billingData.city, billingData.state, billingData.country]
        .filter(Boolean)
        .join(", "),
      paymentMethod,
      note: billingData.note,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal,
      shipping,
      total,
    };

    try {
      await orderApi.create(payload);
      clearCart();
      navigate("/shop");
    } catch (error) {
      setMessage(error.response?.data?.message || "Order could not be submitted. Please check the API or sign in and try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

      <form className="container-fluid" onSubmit={handleSubmit}>
        <div className="row px-xl-5">
          <div className="col-lg-8">
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Billing Address</span>
            </h5>
            <div className="bg-light p-30 mb-5">
              {message && <div className="alert alert-warning">{message}</div>}
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
                      required={["firstName", "lastName", "email", "phone", "address1", "city"].includes(name)}
                    />
                  </div>
                ))}

                <div className="col-md-6 form-group">
                  <label>Country</label>
                  <select className="custom-select" name="country" value={billingData.country} onChange={handleInputChange}>
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
          </div>

          <div className="col-lg-4">
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Order Total</span>
            </h5>
            <div className="bg-light p-30 mb-5">
              <div className="border-bottom">
                <h6 className="mb-3">Products</h6>
                {items.length === 0 ? (
                  <p>No items in cart.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between">
                      <p>{item.name} x {item.quantity}</p>
                      <p>{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-bottom pt-3 pb-2">
                <div className="d-flex justify-content-between mb-3">
                  <h6>Subtotal</h6>
                  <h6>{formatCurrency(subtotal)}</h6>
                </div>
                <div className="d-flex justify-content-between">
                  <h6 className="font-weight-medium">Shipping</h6>
                  <h6 className="font-weight-medium">{formatCurrency(shipping)}</h6>
                </div>
              </div>
              <div className="pt-2">
                <div className="d-flex justify-content-between mt-2">
                  <h5>Total</h5>
                  <h5>{formatCurrency(total)}</h5>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h5 className="section-title position-relative text-uppercase mb-3">
                <span className="bg-secondary pr-3">Payment</span>
              </h5>
              <div className="bg-light p-30">
                {[
                  ["cod", "Cash on Delivery"],
                  ["banktransfer", "Bank Transfer"],
                  ["paypal", "Paypal"],
                ].map(([value, label]) => (
                  <div key={value} className="form-group">
                    <div className="custom-control custom-radio">
                      <input
                        type="radio"
                        className="custom-control-input"
                        name="payment"
                        id={value}
                        value={value}
                        checked={paymentMethod === value}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <label className="custom-control-label" htmlFor={value}>{label}</label>
                    </div>
                  </div>
                ))}
                <button className="btn btn-block btn-primary font-weight-bold py-3" type="submit" disabled={submitting || items.length === 0}>
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default Checkout;
