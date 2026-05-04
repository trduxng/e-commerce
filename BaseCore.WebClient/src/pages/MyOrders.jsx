import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../services/api";
import { formatCurrency } from "../data/shopData";

const statusMeta = {
  pending: { label: "Pending", className: "badge-warning" },
  confirmed: { label: "Confirmed", className: "badge-primary" },
  shipping: { label: "Shipping", className: "badge-info" },
  delivered: { label: "Delivered", className: "badge-success" },
  cancelled: { label: "Cancelled", className: "badge-secondary" },
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await orderApi.getMyOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setOrders([]);
      setError(error.response?.data?.message || "Cannot load your orders.");
    } finally {
      setLoading(false);
    }
  };

  const getOrderDetails = (order) => order.orderDetails || order.details || [];
  const getDetailImage = (detail) => detail.productImageUrl || detail.productVariant?.imageUrl || "/img/product-1.jpg";
  const getStatus = (status) => statusMeta[status] || statusMeta.pending;
  const canCancel = (order) => !["delivered", "cancelled"].includes(order.orderStatus);

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderCode}?`)) return;

    setCancellingId(order.id);
    setError("");

    try {
      const response = await orderApi.cancel(order.id);
      const updatedOrder = response.data?.order || response.data;
      setOrders((current) => current.map((item) => (
        Number(item.id) === Number(order.id)
          ? { ...item, ...updatedOrder, orderDetails: item.orderDetails }
          : item
      )));
    } catch (error) {
      setError(error.response?.data?.message || "Cannot cancel this order.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="my-orders-page">
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Home</Link>
              <span className="breadcrumb-item active">My Orders</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <h2 className="section-title position-relative text-uppercase mb-4">
              <span className="bg-secondary pr-3">My Orders</span>
            </h2>
          </div>

          <div className="col-12">
            {error && <div className="alert alert-warning">{error}</div>}
            {loading ? (
              <div className="bg-light p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="my-orders-empty bg-light p-5 text-center">
                <h5>No orders yet</h5>
                <p className="mb-3">Your purchases will appear here after checkout.</p>
                <Link className="btn btn-primary" to="/shop">Continue Shopping</Link>
              </div>
            ) : (
              <div className="my-orders-list">
                {orders.map((order) => (
                  <article key={order.id} className="order-card bg-light">
                    <div className="order-card-header">
                      <div>
                        <h5 className="mb-1">{order.orderCode}</h5>
                        <small className="text-muted">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                        </small>
                      </div>
                      <span className={`badge ${getStatus(order.orderStatus).className}`}>
                        {getStatus(order.orderStatus).label}
                      </span>
                    </div>

                    <div className="order-products">
                      {getOrderDetails(order).map((detail) => (
                        <div key={detail.id || `${order.id}-${detail.productVariantId}`} className="order-product-row">
                          <img src={getDetailImage(detail)} alt={detail.productNameSnapshot} />
                          <div className="order-product-info">
                            <Link to={`/product/${detail.productId || ""}`} className="order-product-name">
                              {detail.productNameSnapshot}
                            </Link>
                            <small className="text-muted">
                              Qty {detail.quantity}
                              {detail.colorSnapshot ? ` • ${detail.colorSnapshot}` : ""}
                              {detail.sizeSnapshot ? ` • ${detail.sizeSnapshot}` : ""}
                            </small>
                          </div>
                          <div className="order-product-price">
                            {formatCurrency(detail.totalPrice || Number(detail.unitPrice || 0) * Number(detail.quantity || 0))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div>
                        <small className="text-muted d-block">Ship to</small>
                        <span>{order.receiverName} • {order.receiverPhone}</span>
                      </div>
                      <div className="text-right">
                        <small className="text-muted d-block">Total</small>
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                      </div>
                      {canCancel(order) && (
                        <button
                          className="btn btn-outline-dark"
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => cancelOrder(order)}
                        >
                          {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
