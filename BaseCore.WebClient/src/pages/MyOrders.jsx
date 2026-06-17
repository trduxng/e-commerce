import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { orderApi } from "../services/api";
import { formatCurrency } from "../data/shopData";

const statusMeta = {
  pending: { label: "Pending", className: "badge-warning" },
  confirmed: { label: "Confirmed", className: "badge-primary" },
  shipping: { label: "Shipping", className: "badge-info" },
  delivered: { label: "Delivered", className: "badge-success" },
  cancelled: { label: "Cancelled", className: "badge-secondary" },
};

const paymentLabels = {
  cod: "Cash on Delivery",
  banktransfer: "Bank Transfer",
  paypal: "Paypal",
};

const MyOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    searchParams.get("success") === "1" ? "Order placed successfully." : ""
  );
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadOrders(searchParams.get("orderId"));
  }, []);

  const getOrderDetails = (order) => order?.orderDetails || order?.details || [];
  const getDetailImage = (detail) => (
    detail.productImageUrl
    || detail.productVariant?.imageUrl
    || detail.productVariant?.product?.imageUrl
    || "/img/product-1.jpg"
  );
  const getProductId = (detail) => detail.productId || detail.productVariant?.productId || detail.productVariant?.product?.id;
  const normalizeStatus = (status) => {
    const value = String(status || "pending").trim().toLowerCase();
    if (value === "cancel" || value === "canceled") return "cancelled";
    if (value === "completed") return "delivered";
    return value;
  };
  const getStatus = (status) => statusMeta[normalizeStatus(status)] || statusMeta.pending;
  const canCancel = (order) => !["delivered", "cancelled"].includes(normalizeStatus(order?.orderStatus));
  const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "");

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("orderId");
    nextParams.delete("success");
    setSearchParams(nextParams, { replace: true });
  };

  const loadOrderDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setError("");

    try {
      const response = await orderApi.getById(order.id);
      const orderData = response.data?.order || response.data;
      const details = response.data?.details || orderData?.orderDetails || getOrderDetails(order);
      setSelectedOrder({ ...order, ...orderData, orderDetails: details });
    } catch (error) {
      setError(error.response?.data?.message || "Cannot load order detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const loadOrders = async (orderIdToOpen) => {
    setLoading(true);
    setError("");

    try {
      const response = await orderApi.getMyOrders();
      const items = Array.isArray(response.data) ? response.data : [];
      setOrders(items);

      if (orderIdToOpen) {
        const orderToOpen = items.find((order) => Number(order.id) === Number(orderIdToOpen));
        if (orderToOpen) {
          loadOrderDetail(orderToOpen);
        }
      }
    } catch (error) {
      setOrders([]);
      setError(error.response?.data?.message || "Cannot load your orders.");
    } finally {
      setLoading(false);
    }
  };

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
      setSelectedOrder((current) => (
        current && Number(current.id) === Number(order.id)
          ? { ...current, ...updatedOrder, orderDetails: getOrderDetails(current) }
          : current
      ));
    } catch (error) {
      setError(error.response?.data?.message || "Cannot cancel this order.");
    } finally {
      setCancellingId(null);
    }
  };

  const renderOrderProducts = (order) => (
    <div className="order-products">
      {getOrderDetails(order).map((detail) => {
        const productId = getProductId(detail);
        return (
          <div key={detail.id || `${order.id}-${detail.productVariantId}`} className="order-product-row">
            <img src={getDetailImage(detail)} alt={detail.productNameSnapshot || "Product"} />
            <div className="order-product-info">
              {productId ? (
                <Link to={`/product/${productId}`} className="order-product-name">
                  {detail.productNameSnapshot}
                </Link>
              ) : (
                <span className="order-product-name">{detail.productNameSnapshot}</span>
              )}
              <small className="text-muted">
                Qty {detail.quantity}
                {detail.colorSnapshot ? ` - ${detail.colorSnapshot}` : ""}
                {detail.sizeSnapshot ? ` - ${detail.sizeSnapshot}` : ""}
              </small>
            </div>
            <div className="order-product-price">
              {formatCurrency(detail.totalPrice || Number(detail.unitPrice || 0) * Number(detail.quantity || 0))}
            </div>
          </div>
        );
      })}
    </div>
  );

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
              <span className="bg-secondary pe-3">My Orders</span>
            </h2>
          </div>

          <div className="col-12">
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show">
                <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} aria-label="Close"></button>
                {successMessage}
              </div>
            )}
            {error && <div className="alert alert-warning">{error}</div>}
            {loading ? (
              <div className="bg-light p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
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
                        <small className="text-muted">{formatDate(order.createdAt)}</small>
                      </div>
                      <span className={`badge ${getStatus(order.orderStatus).className}`}>
                        {getStatus(order.orderStatus).label}
                      </span>
                    </div>

                    {renderOrderProducts(order)}

                    <div className="order-card-footer">
                      <div>
                        <small className="text-muted d-block">Ship to</small>
                        <span>{order.receiverName} - {order.receiverPhone}</span>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">Total</small>
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                      </div>
                      <button
                        className="btn btn-outline-primary"
                        type="button"
                        onClick={() => loadOrderDetail(order)}
                      >
                        View Details
                      </button>
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

      {selectedOrder && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content order-detail-modal">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">Order {selectedOrder.orderCode}</h5>
                    <small className="text-muted">{formatDate(selectedOrder.createdAt)}</small>
                  </div>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeOrderDetail}></button>
                </div>
                <div className="modal-body">
                  {detailLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="order-detail-summary">
                        <div>
                          <small className="text-muted d-block">Status</small>
                          <span className={`badge ${getStatus(selectedOrder.orderStatus).className}`}>
                            {getStatus(selectedOrder.orderStatus).label}
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block">Payment</small>
                          <strong>{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Payment Status</small>
                          <strong>{selectedOrder.paymentStatus || "pending"}</strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Total</small>
                          <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
                        </div>
                      </div>

                      <div className="order-detail-section">
                        <h6>Shipping Information</h6>
                        <p className="mb-1"><strong>{selectedOrder.receiverName}</strong></p>
                        <p className="mb-1">{selectedOrder.receiverPhone}</p>
                        <p className="mb-1">{selectedOrder.guestEmail}</p>
                        <p className="mb-0">{selectedOrder.shippingAddressFull}</p>
                      </div>

                      {selectedOrder.note && (
                        <div className="order-detail-section">
                          <h6>Order Note</h6>
                          <p className="mb-0">{selectedOrder.note}</p>
                        </div>
                      )}

                      <div className="order-detail-section">
                        <h6>Products</h6>
                        {renderOrderProducts(selectedOrder)}
                      </div>

                      <div className="order-detail-totals">
                        <div><span>Subtotal</span><strong>{formatCurrency(selectedOrder.subtotal)}</strong></div>
                        <div><span>Shipping</span><strong>{formatCurrency(selectedOrder.shippingFee)}</strong></div>
                        <div><span>Discount</span><strong>-{formatCurrency(selectedOrder.discountAmount || 0)}</strong></div>
                        <div><span>Tax</span><strong>{formatCurrency(selectedOrder.taxAmount)}</strong></div>
                        <div className="order-detail-total"><span>Total</span><strong>{formatCurrency(selectedOrder.totalAmount)}</strong></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  {canCancel(selectedOrder) && (
                    <button
                      className="btn btn-outline-dark"
                      type="button"
                      disabled={cancellingId === selectedOrder.id}
                      onClick={() => cancelOrder(selectedOrder)}
                    >
                      {cancellingId === selectedOrder.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                  <button className="btn btn-primary" type="button" onClick={closeOrderDetail}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default MyOrders;
