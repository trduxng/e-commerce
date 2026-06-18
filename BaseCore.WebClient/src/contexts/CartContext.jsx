import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartApi } from "../services/api";
import { getApiErrorMessage, localizeApiMessage } from "../data/shopData";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const normalizeItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getCartItemId = (item) => item?.cartItemId;
const toSelectionKey = (value) => String(value);

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const cartItemIdsRef = useRef(new Set());

  // Áp dụng response mới nhưng vẫn giữ lựa chọn cũ; sản phẩm mới thêm được tự động chọn.
  const applyCartResponse = (data) => {
    const nextItems = normalizeItems(data);
    const nextIds = nextItems
      .map(getCartItemId)
      .filter((id) => id !== null && id !== undefined);
    const previousIds = cartItemIdsRef.current;

    setItems(nextItems);
    setSelectedCartItemIds((currentIds) => {
      const currentSelection = new Set(currentIds.map(toSelectionKey));
      const retainedIds = nextIds.filter((id) => currentSelection.has(toSelectionKey(id)));
      const newIds = nextIds.filter((id) => !previousIds.has(toSelectionKey(id)));
      const mergedIds = [...retainedIds, ...newIds];
      return Array.from(new Map(mergedIds.map((id) => [toSelectionKey(id), id])).values());
    });
    cartItemIdsRef.current = new Set(nextIds.map(toSelectionKey));
  };

  // Giỏ hàng chỉ tồn tại với user đăng nhập; đổi user sẽ tải lại đúng giỏ từ backend.
  const reloadCart = async () => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setSelectedCartItemIds([]);
      cartItemIdsRef.current = new Set();
      return;
    }

    setLoading(true);
    try {
      const response = await cartApi.get();
      applyCartResponse(response.data);
    } catch {
      setItems([]);
      setSelectedCartItemIds([]);
      cartItemIdsRef.current = new Set();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadCart();
  }, [authLoading, user?.userId, user?.id, user?.username, user?.email]);

  // Thêm đúng biến thể sản phẩm; backend sẽ kiểm tra lại trạng thái và tồn kho.
  const addToCart = async (product, quantity = 1, productVariantId = null) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng." };
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const variantId = productVariantId ?? product.productVariantId ?? product.selectedVariantId ?? null;

    try {
      const response = await cartApi.addItem({
        productId: product.id,
        productVariantId: variantId,
        quantity: safeQuantity,
      });
      applyCartResponse(response.data);
      return {
        success: true,
        message: localizeApiMessage(response.data?.message, "Đã thêm sản phẩm vào giỏ hàng."),
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể thêm sản phẩm này vào giỏ hàng."),
      };
    }
  };

  // Cập nhật server trước rồi dùng response làm nguồn dữ liệu mới cho toàn bộ giỏ.
  const updateQuantity = async (id, quantity) => {
    const safeQuantity = Number(quantity);
    if (!Number.isFinite(safeQuantity) || safeQuantity < 1) {
      return { success: false, message: "Số lượng phải từ 1 trở lên." };
    }

    try {
      const response = await cartApi.updateItem(id, safeQuantity);
      applyCartResponse(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể cập nhật sản phẩm trong giỏ hàng."),
      };
    }
  };

  const removeFromCart = async (id) => {
    try {
      const response = await cartApi.removeItem(id);
      applyCartResponse(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng."),
      };
    }
  };

  const clearCart = async () => {
    if (!user) {
      setItems([]);
      setSelectedCartItemIds([]);
      cartItemIdsRef.current = new Set();
      return { success: true };
    }

    try {
      const response = await cartApi.clear();
      applyCartResponse(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể xóa toàn bộ giỏ hàng."),
      };
    }
  };

  // Các tổng tiền ở context phục vụ hiển thị nhanh; backend vẫn tính lại khi checkout.
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const shipping = subtotal > 0 ? 30000 : 0;
    return {
      count: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [items]);

  const allSelectableCartItemIds = useMemo(
    () => items
      .map(getCartItemId)
      .filter((id) => id !== null && id !== undefined),
    [items]
  );

  const selectedCartItemIdSet = useMemo(
    () => new Set(selectedCartItemIds.map(toSelectionKey)),
    [selectedCartItemIds]
  );

  // Tách riêng danh sách/tổng tiền được chọn để hỗ trợ thanh toán một phần giỏ hàng.
  const selectedItems = useMemo(
    () => items.filter((item) => selectedCartItemIdSet.has(toSelectionKey(getCartItemId(item)))),
    [items, selectedCartItemIdSet]
  );

  const selectedTotals = useMemo(() => {
    const selectedSubtotal = selectedItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const selectedShipping = selectedSubtotal > 0 ? 30000 : 0;
    return {
      selectedCount: selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      selectedSubtotal,
      selectedShipping,
      selectedTotal: selectedSubtotal + selectedShipping,
    };
  }, [selectedItems]);

  // Selection chỉ lưu cartItemId vì đây là ID backend yêu cầu khi checkout.
  const toggleCartItemSelection = (cartItemId, checked) => {
    if (cartItemId === null || cartItemId === undefined) return;
    setSelectedCartItemIds((currentIds) => {
      const nextSelection = new Set(currentIds.map(toSelectionKey));
      if (checked) {
        nextSelection.add(toSelectionKey(cartItemId));
      } else {
        nextSelection.delete(toSelectionKey(cartItemId));
      }

      return allSelectableCartItemIds.filter((id) => nextSelection.has(toSelectionKey(id)));
    });
  };

  const selectAllCartItems = () => {
    setSelectedCartItemIds(allSelectableCartItemIds);
  };

  const clearCartSelection = () => {
    setSelectedCartItemIds([]);
  };

  const hasSelectedAllCartItems = allSelectableCartItemIds.length > 0
    && selectedCartItemIds.length === allSelectableCartItemIds.length;

  const value = {
    items,
    selectedItems,
    selectedCartItemIds,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    reloadCart,
    toggleCartItemSelection,
    selectAllCartItems,
    clearCartSelection,
    hasSelectedAllCartItems,
    hasSelectedItems: selectedCartItemIds.length > 0,
    ...totals,
    ...selectedTotals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
