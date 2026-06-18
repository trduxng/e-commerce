import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const toastTitles = {
  success: "Success",
  error: "Something went wrong",
  warning: "Notice",
  info: "Information",
  loading: "Working",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const dedupeKeys = useRef(new Set());

  const dismissToast = useCallback((id) => {
    setToasts((current) => {
      const toast = current.find((item) => item.id === id);
      if (toast?.dedupeKey) {
        dedupeKeys.current.delete(toast.dedupeKey);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const showToast = useCallback(
    ({ type = "info", title = null, message, duration = 4000, dedupeKey = null }) => {
      if (dedupeKey && dedupeKeys.current.has(dedupeKey)) {
        return null;
      }

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const nextToast = {
        id,
        type,
        title: title || toastTitles[type] || toastTitles.info,
        message,
        dedupeKey,
      };

      if (dedupeKey) {
        dedupeKeys.current.add(dedupeKey);
      }

      setToasts((current) => [...current, nextToast]);

      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
      success: (message, options = {}) => showToast({ ...options, type: "success", message }),
      error: (message, options = {}) => showToast({ ...options, type: "error", message }),
      warning: (message, options = {}) => showToast({ ...options, type: "warning", message }),
      info: (message, options = {}) => showToast({ ...options, type: "info", message }),
      loading: (message, options = {}) => showToast({ duration: 0, ...options, type: "loading", message }),
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="app-toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`app-toast app-toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
            <div className="app-toast-icon">
              {toast.type === "loading" ? (
                <span className="app-toast-spinner" aria-hidden="true"></span>
              ) : (
                <i className={`fa ${getToastIcon(toast.type)}`} aria-hidden="true"></i>
              )}
            </div>
            <div className="app-toast-body">
              <strong>{toast.title}</strong>
              {toast.message && <span>{toast.message}</span>}
            </div>
            <button type="button" className="app-toast-close" aria-label="Close notification" onClick={() => dismissToast(toast.id)}>
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const getToastIcon = (type) => {
  if (type === "success") return "fa-check";
  if (type === "error") return "fa-triangle-exclamation";
  if (type === "warning") return "fa-circle-exclamation";
  return "fa-circle-info";
};

export default ToastContext;
