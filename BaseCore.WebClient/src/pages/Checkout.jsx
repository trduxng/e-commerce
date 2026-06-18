import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { addressApi, cartApi, couponApi, checkoutAttributeApi, orderApi } from "../services/api";
import { formatCurrency, getApiErrorMessage, getProductPrice } from "../data/shopData";

const shippingOptions = [
  {
    id: "standard",
    title: "Giao hàng tiêu chuẩn",
    description: "Nhận hàng trong 2-4 ngày làm việc",
    fee: 30000,
    icon: "fa-truck-fast",
  },
  {
    id: "express",
    title: "Giao hàng hỏa tốc",
    description: "Nhận hàng trong 1-2 ngày làm việc",
    fee: 55000,
    icon: "fa-bolt",
  },
  {
    id: "pickup",
    title: "Nhận tại cửa hàng",
    description: "Nhận hàng trực tiếp tại quầy BaseShop",
    fee: 0,
    icon: "fa-store",
  },
];

const paymentOptions = [
  ["cod", "Thanh toán khi nhận hàng", "Thanh toán khi đơn hàng được giao đến", "fa-money-bill-wave"],
  ["banktransfer", "Chuyển khoản ngân hàng", "Chuyển khoản sau khi đơn hàng được xác nhận", "fa-building-columns"],
  ["paypal", "PayPal", "Thanh toán an toàn qua PayPal", "fa-wallet"],
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
  const location = useLocation();
  const { items, selectedItems, selectedSubtotal, selectedCartItemIds, reloadCart } = useCart();
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
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkoutAttributes, setCheckoutAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const buyNowItem = useMemo(() => normalizeBuyNowItem(location.state?.buyNowItem), [location.state]);
  const isBuyNow = buyNowItem !== null;

  useEffect(() => {
    const loadCheckoutData = async () => {
      // Thuộc tính checkout là các dịch vụ bổ sung do admin cấu hình.
      try {
        const response = await checkoutAttributeApi.getAll();
        setCheckoutAttributes(response.data || []);
      } catch (error) {
        console.error("Failed to load checkout attributes", error);
      }
    };
    loadCheckoutData();
  }, []);

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

        // Ưu tiên địa chỉ mặc định, nếu chưa có thì dùng địa chỉ đầu danh sách.
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

  const attrAdjustment = useMemo(() => {
    // Cộng phụ phí của các tùy chọn bổ sung đang được chọn.
    let adjustment = 0;
    Object.entries(selectedAttributes).forEach(([attrId, value]) => {
      const attr = checkoutAttributes.find(a => String(a.id) === attrId);
      if (!attr || !value) return;
      
      const val = attr.values.find(v => String(v.id) === String(value));
      if (val) adjustment += val.priceAdjustment;
    });
    return adjustment;
  }, [selectedAttributes, checkoutAttributes]);

  // Checkout hỗ trợ hai luồng: Mua ngay bằng route state hoặc các dòng được chọn trong giỏ.
  const checkoutItems = isBuyNow ? [buyNowItem] : selectedItems;
  const checkoutSubtotal = isBuyNow
    ? Number(buyNowItem.price || 0) * Number(buyNowItem.quantity || 0)
    : selectedSubtotal;
  const shippingFee = checkoutItems.length > 0 ? selectedShipping.fee : 0;
  const total = Math.max(0, checkoutSubtotal + shippingFee + attrAdjustment - discountAmount);
  const itemCount = checkoutItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const selectedAddress = savedAddresses.find((address) => String(address.id) === String(selectedAddressId));
  const activeAddress = addressMode === "saved" && selectedAddress ? selectedAddress : billingData;
  const receiverName = activeAddress.receiverName?.trim() || "";
  const receiverPhone = activeAddress.phone?.trim() || "";
  const addressPreview = getAddressText(activeAddress);

  useEffect(() => {
    // Thay đổi giỏ làm mã giảm giá cũ mất hiệu lực, buộc người dùng áp dụng lại.
    setDiscountAmount(0);
    setVoucherMessage("");
  }, [checkoutSubtotal]);

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

  // Kiểm tra địa chỉ phía client để báo lỗi trước khi gọi API.
  const validateAddress = (address) => {
    if (!address.receiverName?.trim()) return "Vui lòng nhập tên người nhận.";
    if (!address.phone?.trim()) return "Vui lòng nhập số điện thoại.";
    if (!address.addressDetail?.trim()) return "Vui lòng nhập địa chỉ chi tiết.";
    if (!address.ward?.trim()) return "Vui lòng nhập phường/xã.";
    if (!address.district?.trim()) return "Vui lòng nhập quận/huyện.";
    if (!address.province?.trim()) return "Vui lòng nhập tỉnh/thành phố.";
    return null;
  };

  // Lưu địa chỉ mới vào sổ địa chỉ rồi chuyển checkout sang dùng địa chỉ vừa tạo.
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
      toast.success("Đã lưu địa chỉ.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu địa chỉ."));
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
      toast.success("Đã cập nhật địa chỉ mặc định.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật địa chỉ mặc định."));
    }
  };

  // API apply chỉ phục vụ xem trước; backend checkout sẽ xác thực và tính coupon lại.
  const handleVoucher = async () => {
    if (checkoutItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm trước khi áp dụng mã giảm giá.");
      return;
    }

    if (!voucherCode.trim()) {
      toast.warning("Vui lòng nhập mã giảm giá.");
      return;
    }

    setVoucherMessage("Đang áp dụng...");
    try {
      const response = await couponApi.apply(voucherCode, checkoutSubtotal);
      setDiscountAmount(response.data.discountAmount);
      setVoucherMessage(`Áp dụng mã thành công! Giảm: ${formatCurrency(response.data.discountAmount)}`);
      toast.success("Đã áp dụng mã giảm giá.");
    } catch (error) {
      setDiscountAmount(0);
      const message = getApiErrorMessage(error, "Mã giảm giá không hợp lệ.");
      setVoucherMessage(message);
      toast.error(message);
    }
  };

  // Tạo payload chung, sau đó chọn endpoint theo luồng Mua ngay hoặc Checkout từ giỏ.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (checkoutItems.length === 0) {
      toast.warning(!isBuyNow && items.length === 0 ? "Giỏ hàng của bạn đang trống." : "Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    const validationMessage = validateAddress(activeAddress);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setSubmitting(true);
    loadingToastRef.current = toast.loading("Đang tạo đơn hàng...");
    const checkoutPayload = {
      receiverName,
      email: billingData.email,
      receiverPhone,
      shippingAddress: addressPreview,
      paymentMethod,
      note: billingData.note,
      shippingMethod,
      couponCode: discountAmount > 0 ? voucherCode : null,
      discountAmount: discountAmount,
      checkoutAttributes: selectedAttributes
    };

    try {
      const response = isBuyNow
        ? await orderApi.create({
            ...checkoutPayload,
            items: [{
              productId: buyNowItem.productId,
              productVariantId: buyNowItem.productVariantId,
              quantity: buyNowItem.quantity,
            }],
          })
        : await cartApi.checkout({
            ...checkoutPayload,
            cartItemIds: selectedCartItemIds,
          });
      const orderId = response.data?.order?.id || response.data?.id;
      if (!isBuyNow) {
        // Backend đã xóa các dòng vừa mua nên context phải tải lại giỏ còn lại.
        await reloadCart();
      }
      if (loadingToastRef.current) {
        toast.dismissToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      toast.success("Đặt hàng thành công.");
      navigate(orderId ? `/my-orders?orderId=${orderId}&success=1` : "/my-orders?success=1");
    } catch (error) {
      if (loadingToastRef.current) {
        toast.dismissToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }
      toast.error(getApiErrorMessage(error, "Không thể gửi đơn hàng."));
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
              <Link className="breadcrumb-item text-dark" to="/">Trang chủ</Link>
              <Link className="breadcrumb-item text-dark" to="/shop">Cửa hàng</Link>
              <span className="breadcrumb-item active">Thanh toán</span>
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
                  <span className="checkout-step">Giao hàng</span>
                  <h4>Địa chỉ giao hàng</h4>
                </div>
                <i className="fa fa-location-dot"></i>
              </div>

              <div className="checkout-address-preview">
                <div>
                  <strong>{receiverName || "Tên người nhận"}</strong>
                  <span>{receiverPhone || "Số điện thoại"}</span>
                </div>
                <p>{addressPreview || "Vui lòng nhập địa chỉ giao hàng bên dưới."}</p>
              </div>

              <div className="checkout-address-actions">
                <button
                  className={`btn btn-sm ${addressMode === "new" ? "btn-primary" : "btn-outline-primary"}`}
                  type="button"
                  onClick={handleUseNewAddress}
                >
                  <i className="fa fa-plus mr-2"></i>
                  Thêm địa chỉ mới
                </button>
              </div>

              {addressLoading ? (
                <div className="checkout-address-loading">Đang tải địa chỉ đã lưu...</div>
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
                          {address.isDefault && <small>Mặc định</small>}
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
                          Đặt làm mặc định
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="row">
                <div className="col-md-6 form-group">
                  <label>Email</label>
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
                      ["receiverName", "Tên người nhận", "Nguyễn Văn A", "text"],
                      ["phone", "Số điện thoại", "+84 909 123 456", "text"],
                      ["addressDetail", "Địa chỉ chi tiết", "123 đường Nguyễn Huệ", "text"],
                      ["ward", "Phường/Xã", "Phường Bến Nghé", "text"],
                      ["district", "Quận/Huyện", "Quận 1", "text"],
                      ["province", "Tỉnh/Thành phố", "Thành phố Hồ Chí Minh", "text"],
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
                          <span>Đặt làm địa chỉ giao hàng mặc định</span>
                        </label>
                        <button
                          className="btn btn-outline-primary"
                          type="button"
                          onClick={handleSaveAddress}
                          disabled={savingAddress}
                        >
                          {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="col-md-12 form-group mb-0">
                  <label>Ghi chú đơn hàng</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="note"
                    placeholder="Hướng dẫn giao hàng"
                    value={billingData.note}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="checkout-panel">
                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pe-3">Tùy chọn bổ sung</span>
                </h5>
                <div className="bg-light p-30 mb-4">
                    {checkoutAttributes.map(attr => (
                        <div key={attr.id} className="form-group mb-3">
                            <label className="fw-bold">{attr.name}{attr.isRequired && <span className="text-danger">*</span>}</label>
                            {attr.controlType === 'DropdownList' && (
                                <select className="form-control" value={selectedAttributes[attr.id] || ''} onChange={e => setSelectedAttributes({...selectedAttributes, [attr.id]: e.target.value})}>
                                    <option value="">Chọn một tùy chọn</option>
                                    {attr.values.map(v => <option key={v.id} value={v.id}>{v.name} {v.priceAdjustment > 0 ? `(+${formatCurrency(v.priceAdjustment)})` : ''}</option>)}
                                </select>
                            )}
                            {attr.controlType === 'RadioList' && (
                                <div className="mt-2">
                                    {attr.values.map(v => (
                                        <div key={v.id} className="custom-control custom-radio">
                                            <input type="radio" className="custom-control-input" id={`attr-${v.id}`} name={`attr-${attr.id}`} checked={String(selectedAttributes[attr.id]) === String(v.id)} onChange={() => setSelectedAttributes({...selectedAttributes, [attr.id]: String(v.id)})} />
                                            <label className="custom-control-label" htmlFor={`attr-${v.id}`}>{v.name} {v.priceAdjustment > 0 ? `(+${formatCurrency(v.priceAdjustment)})` : ''}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {checkoutAttributes.length === 0 && <p className="text-muted small mb-0">Hiện chưa có dịch vụ bổ sung.</p>}
                </div>
            </div>

            <div className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Đơn hàng</span>
                  <h4>Sản phẩm đặt mua</h4>
                </div>
                <span className="checkout-count">{itemCount} sản phẩm</span>
              </div>

              {checkoutItems.length === 0 ? (
                <div className="checkout-empty">
                  <h5>{!isBuyNow && items.length === 0 ? "Giỏ hàng của bạn đang trống" : "Chưa chọn sản phẩm"}</h5>
                  <Link to={!isBuyNow && items.length === 0 ? "/shop" : "/cart"} className="btn btn-primary">
                    {!isBuyNow && items.length === 0 ? "Tiếp tục mua sắm" : "Chọn sản phẩm"}
                  </Link>
                </div>
              ) : (
                <div className="checkout-items">
                  {checkoutItems.map((item, index) => (
                    <div key={getItemKey(item, index)} className="checkout-item">
                      <img src={item.imageUrl || "/img/product-1.jpg"} alt={item.name} />
                      <div className="checkout-item-info">
                        <h6>{item.name}</h6>
                        {(item.size || item.color) && (
                          <small>
                            {[item.size && `Kích thước: ${item.size}`, item.color && `Màu sắc: ${item.color}`]
                              .filter(Boolean)
                              .join(" | ")}
                          </small>
                        )}
                      </div>
                      <div className="checkout-item-price">{formatCurrency(getProductPrice(item))}</div>
                      <div className="checkout-item-qty">x{item.quantity}</div>
                      <div className="checkout-item-total">{formatCurrency(getProductPrice(item) * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <span className="checkout-step">Vận chuyển</span>
                  <h4>Phương thức vận chuyển</h4>
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
                  <span className="checkout-step">Thanh toán</span>
                  <h4>Phương thức thanh toán</h4>
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
                  Mã giảm giá
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã giảm giá"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                  />
                  <button className="btn btn-outline-primary" type="button" onClick={handleVoucher}>
                    Áp dụng
                  </button>
                </div>
                {voucherMessage && <small className={discountAmount > 0 ? "text-success" : "text-danger"}>{voucherMessage}</small>}
              </div>

              <div className="checkout-summary-card">
                <div className="checkout-summary-title">
                  <i className="fa fa-receipt"></i>
                  Tóm tắt đơn hàng
                </div>
                <div className="checkout-summary-row">
                  <span>Tạm tính</span>
                  <strong>{formatCurrency(checkoutSubtotal)}</strong>
                </div>
                <div className="checkout-summary-row">
                  <span>Phí vận chuyển</span>
                  <strong>{formatCurrency(shippingFee)}</strong>
                </div>
                {discountAmount > 0 && (
                  <div className="checkout-summary-row text-success">
                    <span>Giảm giá</span>
                    <strong>-{formatCurrency(discountAmount)}</strong>
                  </div>
                )}
                {attrAdjustment > 0 && (
                  <div className="checkout-summary-row text-info">
                    <span>Dịch vụ bổ sung</span>
                    <strong>+{formatCurrency(attrAdjustment)}</strong>
                  </div>
                )}
                <div className="checkout-summary-row border-top mt-2 pt-2">
                  <span><strong>Tổng cộng</strong></span>
                  <strong className="text-primary h5 mb-0">{formatCurrency(total)}</strong>
                </div>
                <button
                  className="btn w-100 btn-primary checkout-submit mt-3"
                  type="submit"
                  disabled={submitting || checkoutItems.length === 0}
                >
                  {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </>
  );
};

const normalizeBuyNowItem = (item) => {
  // Không tin trực tiếp route state: chuẩn hóa ID, số lượng và giá trước khi render.
  if (!item) return null;

  const productId = Number(item.productId ?? item.id);
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const price = Number(item.price);
  if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    ...item,
    id: productId,
    productId,
    productVariantId: item.productVariantId ? Number(item.productVariantId) : null,
    quantity,
    price,
  };
};

export default Checkout;
