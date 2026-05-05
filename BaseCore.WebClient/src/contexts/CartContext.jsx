import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProductImage } from "../data/shopData";

const CartContext = createContext(null);
const STORAGE_KEY = "basecore_cart";

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setItems((currentItems) => {
      const existing = currentItems.find((item) => Number(item.id) === Number(product.id));
      if (existing) {
        const newQuantity = existing.quantity + safeQuantity;
        // Stock Validation
        const finalQuantity = product.stock ? Math.min(newQuantity, product.stock) : newQuantity;
        
        return currentItems.map((item) =>
          Number(item.id) === Number(product.id)
            ? { ...item, quantity: finalQuantity }
            : item
        );
      }

      // Stock Validation for new item
      const initialQuantity = product.stock ? Math.min(safeQuantity, product.stock) : safeQuantity;

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          imageUrl: getProductImage(product),
          stock: product.stock,
          quantity: initialQuantity,
        },
      ];
    });
  };

  const updateQuantity = (id, quantity) => {
    const safeQuantity = Number(quantity);
    if (!Number.isFinite(safeQuantity) || safeQuantity < 1) return;
    
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (Number(item.id) === Number(id)) {
           // Stock Validation
           const finalQuantity = item.stock ? Math.min(safeQuantity, item.stock) : safeQuantity;
           return { ...item, quantity: finalQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setItems((currentItems) => currentItems.filter((item) => Number(item.id) !== Number(id)));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const shipping = subtotal > 0 ? 30000 : 0;
    return {
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [items]);

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    ...totals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
