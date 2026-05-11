import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../data/shopData";

const Cart = () => {
  const { items, subtotal, shipping, total, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = React.useState("");
  const [quantityDrafts, setQuantityDrafts] = React.useState({});

  const changeQuantity = async (item, quantity) => {
    const result = await updateQuantity(item.productVariantId ?? item.cartItemId ?? item.id, quantity);
    setQuantityDrafts((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[item.productVariantId ?? item.cartItemId ?? item.id];
      return nextDrafts;
    });
    setMessage(result?.message || "");
  };

  const commitQuantityInput = (item, value) => {
    const nextQuantity = Math.max(1, Math.floor(Number(value) || 1));
    changeQuantity(item, nextQuantity);
  };

  const getItemKey = (item) => item.productVariantId ?? item.cartItemId ?? item.id;

  const removeItem = async (item) => {
    const result = await removeFromCart(item.productVariantId ?? item.cartItemId ?? item.id);
    setMessage(result?.message || "");
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Shop</Link>
              <span className="breadcrumb-item active">Shopping Cart</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-lg-8 table-responsive mb-5">
            {message && (
              <div className="alert alert-warning alert-dismissible">
                <button type="button" className="close" onClick={() => setMessage("")}>
                  &times;
                </button>
                {message}
              </div>
            )}
            {items.length === 0 ? (
              <div className="bg-light p-5 text-center">
                <h4>Your cart is empty</h4>
                <p>Add products from the shop before checkout.</p>
                <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
              </div>
            ) : (
              <table className="table table-light table-borderless table-hover text-center mb-0">
                <thead className="thead-dark">
                  <tr>
                    <th>Products</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody className="align-middle">
                  {items.map((item) => (
                    <tr key={getItemKey(item)}>
                      <td className="align-middle text-left">
                        <img src={item.imageUrl} alt={item.name} style={{ width: "50px" }} className="mr-2" />
                        {item.name}
                        {(item.size || item.color) && (
                          <small className="text-muted d-block ml-5">
                            {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(" | ")}
                          </small>
                        )}
                      </td>
                      <td className="align-middle">{formatCurrency(item.price)}</td>
                      <td className="align-middle">
                        <div className="input-group quantity mx-auto" style={{ width: "130px" }}>
                          <div className="input-group-prepend">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary btn-minus"
                              onClick={() => changeQuantity(item, Math.max(1, Number(item.quantity || 1) - 1))}
                            >
                              <i className="fa fa-minus"></i>
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control form-control-sm bg-white text-dark text-center"
                            value={quantityDrafts[getItemKey(item)] ?? item.quantity}
                            onChange={(event) => {
                              if (/^\d*$/.test(event.target.value)) {
                                setQuantityDrafts((drafts) => ({
                                  ...drafts,
                                  [getItemKey(item)]: event.target.value,
                                }));
                              }
                            }}
                            onBlur={(event) => commitQuantityInput(item, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                            }}
                            aria-label="Quantity"
                          />
                          <div className="input-group-append">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary btn-plus"
                              disabled={item.stock !== null && item.stock !== undefined && item.quantity >= Number(item.stock)}
                              onClick={() => changeQuantity(item, Number(item.quantity || 1) + 1)}
                            >
                              <i className="fa fa-plus"></i>
                            </button>
                          </div>
                        </div>
                        {item.stock !== null && item.stock !== undefined && (
                          <small className="text-muted d-block mt-1">Stock: {item.stock}</small>
                        )}
                      </td>
                      <td className="align-middle">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="align-middle">
                        <button className="btn btn-sm btn-danger" type="button" onClick={() => removeItem(item)}>
                          <i className="fa fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="col-lg-4">
            <form className="mb-30" onSubmit={(event) => event.preventDefault()}>
              <div className="input-group">
                <input type="text" className="form-control border-0 p-4" placeholder="Coupon Code" />
                <div className="input-group-append">
                  <button className="btn btn-primary" type="submit">Apply Coupon</button>
                </div>
              </div>
            </form>
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pr-3">Cart Summary</span>
            </h5>
            <div className="bg-light p-30 mb-5">
              <div className="border-bottom pb-2">
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
                <Link
                  to={isAuthenticated ? "/checkout" : "/login?returnUrl=/checkout"}
                  className={`btn btn-block btn-primary font-weight-bold my-3 py-3 ${items.length === 0 ? "disabled" : ""}`}
                >
                  {isAuthenticated ? "Proceed To Checkout" : "Login To Checkout"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
