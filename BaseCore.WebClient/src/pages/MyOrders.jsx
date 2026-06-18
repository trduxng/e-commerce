import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { orderApi, productApi } from "../services/api";
import { formatCurrency } from "../data/shopData";
import { useToast } from "../contexts/ToastContext";

const statusMeta = {
  pending: { label: "Pending", className: "badge-warning" },
  confirmed: { label: "Confirmed", className: "badge-primary" },
  shipping: { label: "Shipping", className: "badge-info" },
  delivered: { label: "Delivered", className: "badge-success" },
  cancelled: { label: "Cancelled", className: "badge-secondary" },
  return_requested: { label: "Return Requested", className: "badge-info" },
  returned: { label: "Returned", className: "badge-dark" },
  refunded: { label: "Refunded", className: "badge-danger" },
};

const paymentLabels = {
  cod: "Cash on Delivery",
  banktransfer: "Bank Transfer",
  paypal: "Paypal",
};

const MyOrders = () => {
  const toast = useToast();
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
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

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
  const canCancel = (order) => !["delivered", "cancelled", "return_requested", "returned", "refunded"].includes(normalizeStatus(order?.orderStatus));
  const canReturn = (order) => normalizeStatus(order?.orderStatus) === "delivered";
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

  const requestReturn = async (order) => {
    if (!window.confirm(`Request a return for order ${order.orderCode}?`)) return;

    setError("");
    try {
      const response = await orderApi.requestReturn(order.id);
      const updatedOrder = response.data;
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
      toast.success("Return requested successfully.");
    } catch (error) {
      setError(error.response?.data?.message || "Cannot request return.");
    }
  };

  const openReview = (order, detail) => {
    if (detail.isReviewed) {
      toast.info("Bạn đã đánh giá đơn hàng này rồi.");
      return;
    }

    const productId = getProductId(detail);
    if (!productId) {
      toast.error("Không tìm thấy sản phẩm để đánh giá.");
      return;
    }

    setSelectedOrder(null);
    setReviewForm({ rating: 5, content: "" });
    setReviewTarget({
      orderId: order.id,
      orderCode: order.orderCode,
      billDetailId: detail.id,
      productId,
      productName: detail.productNameSnapshot || "Product",
      imageUrl: getDetailImage(detail),
    });
  };

  const closeReview = () => {
    if (submittingReview) return;
    setReviewTarget(null);
  };

  const markDetailReviewed = (order, orderId, billDetailId, reviewId) => {
    if (!order || Number(order.id) !== Number(orderId)) return order;

    return {
      ...order,
      orderDetails: getOrderDetails(order).map((detail) => (
        Number(detail.id) === Number(billDetailId)
          ? { ...detail, isReviewed: true, reviewId: reviewId || detail.reviewId }
          : detail
      )),
    };
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewTarget) return;

    const content = reviewForm.content.trim();
    if (!content) {
      toast.warning("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await productApi.saveReview(reviewTarget.productId, {
        billDetailId: reviewTarget.billDetailId,
        rating: Number(reviewForm.rating),
        content,
      });
      const submittedReview = response.data?.items?.find((item) => (
        Number(item.billDetailId) === Number(reviewTarget.billDetailId)
      ));

      setOrders((current) => current.map((order) => (
        markDetailReviewed(order, reviewTarget.orderId, reviewTarget.billDetailId, submittedReview?.id)
      )));
      setSelectedOrder((current) => (
        markDetailReviewed(current, reviewTarget.orderId, reviewTarget.billDetailId, submittedReview?.id)
      ));
      setReviewTarget(null);
      toast.success("Đánh giá sản phẩm thành công.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi đánh giá sản phẩm.");
    } finally {
      setSubmittingReview(false);
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
            {normalizeStatus(order.orderStatus) === "delivered" && (
              <div className="order-product-actions">
                <button
                  className={`btn btn-sm ${detail.isReviewed ? "btn-outline-secondary" : "btn-outline-primary"}`}
                  type="button"
                  onClick={() => openReview(order, detail)}
                >
                  <i className="fa fa-star mr-1"></i>
                  {detail.isReviewed ? "Đã đánh giá" : "Đánh giá sản phẩm"}
                </button>
              </div>
            )}
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
                          {canReturn(order) && (
                          <button
                          className="btn btn-outline-info"
                          type="button"
                          onClick={() => requestReturn(order)}
                          >
                          Request Return
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
                  {canReturn(selectedOrder) && (
                    <button
                      className="btn btn-outline-info"
                      type="button"
                      onClick={() => requestReturn(selectedOrder)}
                    >
                      Request Return
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

      {reviewTarget && (
        <>
          <div className="modal fade show review-order-modal" style={{ display: "block" }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content" onSubmit={submitReview}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">Đánh giá sản phẩm</h5>
                    <small className="text-muted">Đơn hàng {reviewTarget.orderCode}</small>
                  </div>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeReview}></button>
                </div>
                <div className="modal-body">
                  <div className="review-order-product">
                    <img src={reviewTarget.imageUrl} alt={reviewTarget.productName} />
                    <strong>{reviewTarget.productName}</strong>
                  </div>
                  <label className="form-label d-block">Số sao</label>
                  <div className="review-rating-control mb-3" role="radiogroup" aria-label="Số sao đánh giá">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={value <= reviewForm.rating ? "is-active" : ""}
                        onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}
                        aria-label={`${value} sao`}
                      >
                        <i className="fa fa-star"></i>
                      </button>
                    ))}
                    <span>{reviewForm.rating}/5</span>
                  </div>
                  <label className="form-label" htmlFor="order-review-content">Nội dung đánh giá</label>
                  <textarea
                    id="order-review-content"
                    className="form-control"
                    rows={5}
                    maxLength={2000}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm"
                    value={reviewForm.content}
                    onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" type="button" onClick={closeReview} disabled={submittingReview}>Hủy</button>
                  <button className="btn btn-primary" type="submit" disabled={submittingReview}>
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default MyOrders;
