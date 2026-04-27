import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../data/shopData";

const Cart = () => {
  const { items, subtotal, shipping, total, updateQuantity, removeFromCart } = useCart();

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
                    <tr key={item.id}>
                      <td className="align-middle text-left">
                        <img src={item.imageUrl} alt={item.name} style={{ width: "50px" }} className="mr-2" />
                        {item.name}
                      </td>
                      <td className="align-middle">{formatCurrency(item.price)}</td>
                      <td className="align-middle">
                        <div className="input-group quantity mx-auto" style={{ width: "110px" }}>
                          <div className="input-group-btn">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary btn-minus"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <i className="fa fa-minus"></i>
                            </button>
                          </div>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-secondary border-0 text-center"
                            value={item.quantity}
                            readOnly
                          />
                          <div className="input-group-btn">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary btn-plus"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <i className="fa fa-plus"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">{formatCurrency(item.price * item.quantity)}</td>
                      <td className="align-middle">
                        <button className="btn btn-sm btn-danger" type="button" onClick={() => removeFromCart(item.id)}>
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
                  to="/checkout"
                  className={`btn btn-block btn-primary font-weight-bold my-3 py-3 ${items.length === 0 ? "disabled" : ""}`}
                >
                  Proceed To Checkout
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
