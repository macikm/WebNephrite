"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "2rem",
          margin: "1rem 0",
          background: "rgba(244, 63, 94, 0.1)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          borderRadius: "var(--radius-lg)",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--accent-rose)" }}>
            <AlertTriangle size={24} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {this.props.fallbackTitle || "Došlo k chybě při zobrazení této části"}
            </h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {this.state.error?.message || "Neznámá chyba v komponentě."}
          </p>
          <div>
            <button
              onClick={this.handleReset}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              <RefreshCw size={14} />
              <span>Zkusit znovu</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
