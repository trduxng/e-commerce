import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cartApi } from "../services/api";
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

const getErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  return responseData?.message || fallback;
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const applyCartResponse = (data) => {
    setItems(normalizeItems(data));
  };

  const reloadCart = async () => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await cartApi.get();
      applyCartResponse(response.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadCart();
  }, [authLoading, user?.userId, user?.id, user?.username, user?.email]);

  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      return { success: false, message: "Please sign in before adding products to cart." };
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    try {
      const response = await cartApi.addItem({
        productId: product.id,
        quantity: safeQuantity,
      });
      applyCartResponse(response.data);
      return { success: true, message: response.data?.message || "Product added to cart." };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Cannot add this product."),
      };
    }
  };

  const updateQuantity = async (id, quantity) => {
    const safeQuantity = Number(quantity);
    if (!Number.isFinite(safeQuantity) || safeQuantity < 1) {
      return { success: false, message: "Quantity must be at least 1." };
    }

    try {
      const response = await cartApi.updateItem(id, safeQuantity);
      applyCartResponse(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Cannot update cart item."),
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
        message: getErrorMessage(error, "Cannot remove cart item."),
      };
    }
  };

  const clearCart = async () => {
    if (!user) {
      setItems([]);
      return { success: true };
    }

    try {
      const response = await cartApi.clear();
      applyCartResponse(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Cannot clear cart."),
      };
    }
  };

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

  const value = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    reloadCart,
    ...totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
