import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatCurrency } from "../data/shopData";

const Cart = () => {
  const {
    items,
    loading,
    selectedItems,
    selectedCartItemIds,
    selectedSubtotal,
    selectedShipping,
    selectedTotal,
    hasSelectedAllCartItems,
    toggleCartItemSelection,
    selectAllCartItems,
    clearCartSelection,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [quantityDrafts, setQuantityDrafts] = React.useState({});
  const selectAllRef = React.useRef(null);

  // Dùng Set để kiểm tra nhanh sản phẩm nào đang được chọn.
  const selectedIdSet = React.useMemo(
    () => new Set(selectedCartItemIds.map((id) => String(id))),
    [selectedCartItemIds]
  );
  const selectedLineCount = selectedItems.length;

  // Hiển thị trạng thái "chọn một phần" khi chỉ một số sản phẩm được chọn.
  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedLineCount > 0 && selectedLineCount < items.length;
    }
  }, [items.length, selectedLineCount]);

  // Cập nhật số lượng trên backend rồi xóa giá trị người dùng đang nhập tạm.
  const changeQuantity = async (item, quantity) => {
    const result = await updateQuantity(item.productVariantId ?? item.cartItemId ?? item.id, quantity);
    setQuantityDrafts((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[item.productVariantId ?? item.cartItemId ?? item.id];
      return nextDrafts;
    });
    if (result?.message) {
      toast.error(result.message);
    } else {
      toast.success("Đã cập nhật số lượng sản phẩm.");
    }
  };

  // Chuẩn hóa số lượng thành số nguyên, tối thiểu là 1 trước khi gửi lên backend.
  const commitQuantityInput = (item, value) => {
    const nextQuantity = Math.max(1, Math.floor(Number(value) || 1));
    changeQuantity(item, nextQuantity);
  };

  // Key phục vụ render có fallback; cartItemId là ID dùng để chọn sản phẩm checkout.
  const getItemKey = (item) => item.productVariantId ?? item.cartItemId ?? item.id;
  const getCartItemId = (item) => item.cartItemId;

  // Xóa một sản phẩm khỏi giỏ hàng.
  const removeItem = async (item) => {
    const result = await removeFromCart(item.productVariantId ?? item.cartItemId ?? item.id);
    if (result?.message) {
      toast.error(result.message);
    } else {
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    }
  };

  // Xóa toàn bộ giỏ hàng và dữ liệu số lượng đang nhập dở.
  const clearAllItems = async () => {
    const result = await clearCart();
    setQuantityDrafts({});
    if (result?.message) {
      toast.error(result.message);
    } else {
      toast.success("Đã xóa toàn bộ giỏ hàng.");
    }
  };

  // Chọn hoặc bỏ chọn toàn bộ sản phẩm trong giỏ.
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      selectAllCartItems();
    } else {
      clearCartSelection();
    }
  };

  // Chặn chuyển trang nếu người dùng chưa chọn sản phẩm để thanh toán.
  const handleCheckoutClick = (event) => {
    if (selectedLineCount > 0) return;
    event.preventDefault();
    toast.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-12">
            <nav className="breadcrumb bg-light mb-30">
              <Link className="breadcrumb-item text-dark" to="/">Trang chủ</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Cửa hàng</Link>
              <span className="breadcrumb-item active">Giỏ hàng</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row px-xl-5">
          <div className="col-lg-8 mb-5">
            {loading ? (
              <div className="cart-empty-state bg-light p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="cart-empty-state bg-light p-5 text-center">
                <h4>Giỏ hàng của bạn đang trống</h4>
                <p>Hãy thêm sản phẩm từ cửa hàng trước khi thanh toán.</p>
                <Link to="/shop" className="btn btn-primary">Tiếp tục mua sắm</Link>
              </div>
            ) : (
              <div className="cart-panel bg-light">
                <div className="cart-panel-header">
                  <div>
                    <h4>Giỏ hàng</h4>
                    <span>Đã chọn {selectedLineCount}/{items.length} sản phẩm</span>
                  </div>
                  <label className="cart-select-all">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={hasSelectedAllCartItems}
                      onChange={handleSelectAll}
                    />
                    <span>Chọn tất cả</span>
                  </label>
                  <button className="btn btn-outline-dark" type="button" onClick={clearAllItems}>
                    <i className="fa fa-trash me-1"></i>
                    Xóa tất cả
                  </button>
                </div>

                <div className="cart-line-list">
                  {items.map((item) => (
                    <article key={getItemKey(item)} className={`cart-line-item ${selectedIdSet.has(String(getCartItemId(item))) ? "is-selected" : ""}`}>
                      <label className="cart-line-select" htmlFor={`cart-line-select-${getItemKey(item)}`}>
                        <input
                          type="checkbox"
                          id={`cart-line-select-${getItemKey(item)}`}
                          checked={selectedIdSet.has(String(getCartItemId(item)))}
                          onChange={(event) => toggleCartItemSelection(getCartItemId(item), event.target.checked)}
                        />
                        <span className="visually-hidden">Chọn {item.name}</span>
                      </label>
                      <img src={item.imageUrl || "/img/product-1.jpg"} alt={item.name} />
                      <div className="cart-line-info">
                        <Link to={`/product/${item.productId || item.id}`}>{item.name}</Link>
                        {(item.size || item.color || item.sku) && (
                          <small>
                            {[item.size && `Kích thước: ${item.size}`, item.color && `Màu sắc: ${item.color}`, item.sku && `SKU: ${item.sku}`]
                              .filter(Boolean)
                              .join(" | ")}
                          </small>
                        )}
                        {item.stock !== null && item.stock !== undefined && (
                          <small>Tồn kho: {item.stock}</small>
                        )}
                      </div>
                      <div className="cart-line-price">{formatCurrency(item.price)}</div>
                      <div className="cart-line-quantity">
                        <div className="input-group quantity">
                          <div>
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
                            aria-label="Số lượng"
                          />
                          <div>
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
                      </div>
                      <div className="cart-line-total">{formatCurrency(item.lineTotal || item.price * item.quantity)}</div>
                      <button className="btn btn-sm btn-outline-dark cart-line-remove" type="button" onClick={() => removeItem(item)}>
                        <i className="fa fa-times"></i>
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <form className="mb-30" onSubmit={(event) => event.preventDefault()}>
              <div className="input-group">
                <input type="text" className="form-control border-0 p-4" placeholder="Mã giảm giá" />
                <button className="btn btn-primary" type="submit">Áp dụng mã</button>
              </div>
            </form>
            <h5 className="section-title position-relative text-uppercase mb-3">
              <span className="bg-secondary pe-3">Tóm tắt giỏ hàng</span>
            </h5>
            <div className="bg-light p-30 mb-5">
              <div className="border-bottom pb-2">
                <div className="d-flex justify-content-between mb-3">
                  <h6>Tạm tính sản phẩm đã chọn</h6>
                  <h6>{formatCurrency(selectedSubtotal)}</h6>
                </div>
                <div className="d-flex justify-content-between">
                  <h6 className="fw-medium">Phí vận chuyển</h6>
                  <h6 className="fw-medium">{formatCurrency(selectedShipping)}</h6>
                </div>
              </div>
              <div className="pt-2">
                <div className="d-flex justify-content-between mt-2">
                  <h5>Tổng cộng</h5>
                  <h5>{formatCurrency(selectedTotal)}</h5>
                </div>
                <Link
                  to={isAuthenticated ? "/checkout" : "/login?returnUrl=/checkout"}
                  className={`btn w-100 btn-primary fw-bold my-3 py-3 ${selectedLineCount === 0 ? "disabled" : ""}`}
                  onClick={handleCheckoutClick}
                >
                  {isAuthenticated ? `Thanh toán sản phẩm đã chọn (${selectedLineCount})` : "Đăng nhập để thanh toán"}
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
