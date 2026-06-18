import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { favoriteApi } from "../services/api";
import { getApiErrorMessage, localizeApiMessage } from "../data/shopData";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext(null);

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoriteProvider");
  }
  return context;
};

const normalizeIds = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((id) => Number(id)).filter((id) => Number.isFinite(id));
};

export const FavoriteProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Chỉ tải danh sách ID để mọi ProductCard có thể kiểm tra yêu thích nhanh.
  const reloadFavorites = async () => {
    if (authLoading) return;
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    setLoading(true);
    try {
      const response = await favoriteApi.getIds();
      setFavoriteIds(normalizeIds(response.data));
    } catch {
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadFavorites();
  }, [authLoading, user?.userId, user?.id, user?.username, user?.email]);

  const isFavorite = (productId) => favoriteIds.includes(Number(productId));

  // Sau khi API thành công, cập nhật state cục bộ để giao diện phản hồi ngay.
  const addFavorite = async (productId) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập trước khi thêm sản phẩm yêu thích." };
    }

    try {
      const response = await favoriteApi.add(productId);
      setFavoriteIds((current) => {
        const id = Number(productId);
        return current.includes(id) ? current : [...current, id];
      });
      return {
        success: true,
        isFavorite: true,
        message: localizeApiMessage(
          response.data?.message || response.data?.Message,
          "Đã thêm sản phẩm vào danh sách yêu thích."
        ),
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể thêm sản phẩm vào danh sách yêu thích."),
      };
    }
  };

  const removeFavorite = async (productId) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập trước khi cập nhật danh sách yêu thích." };
    }

    try {
      const response = await favoriteApi.remove(productId);
      setFavoriteIds((current) => current.filter((id) => id !== Number(productId)));
      return {
        success: true,
        isFavorite: false,
        message: localizeApiMessage(
          response.data?.message || response.data?.Message,
          "Đã xóa sản phẩm khỏi danh sách yêu thích."
        ),
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Không thể xóa sản phẩm khỏi danh sách yêu thích."),
      };
    }
  };

  // Một điểm vào chung cho nút trái tim: tự quyết định gọi thêm hay xóa.
  const toggleFavorite = async (productId) => {
    return isFavorite(productId) ? removeFavorite(productId) : addFavorite(productId);
  };

  const value = useMemo(() => ({
    favoriteIds,
    count: favoriteIds.length,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reloadFavorites,
  }), [favoriteIds, loading, user]);

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
};

export default FavoriteContext;
