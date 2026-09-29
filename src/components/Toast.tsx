"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 size={18} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />;
      case "error":
        return <AlertCircle size={18} style={{ color: "var(--accent-rose)", flexShrink: 0 }} />;
      case "warning":
        return <AlertTriangle size={18} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />;
      case "info":
      default:
        return <Info size={18} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success": return "rgba(16, 185, 129, 0.4)";
      case "error": return "rgba(244, 63, 94, 0.4)";
      case "warning": return "rgba(245, 158, 11, 0.4)";
      case "info": default: return "rgba(6, 182, 212, 0.4)";
    }
  };

  return (
    <div 
      className={`toast toast-${toast.type}`}
      style={{ borderColor: getBorderColor() }}
    >
      {renderIcon()}
      <div style={{ flex: 1, fontWeight: 500 }}>{toast.text}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ color: "var(--text-dim)", padding: "2px", display: "flex", cursor: "pointer" }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
