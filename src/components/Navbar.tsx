"use client";

import { LogOut, User, Globe, Database, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavbarProps {
  title: string;
  userName?: string;
  dbProfile?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({
  title,
  userName = "tester",
  dbProfile = "Demo",
  onRefresh,
  isRefreshing = false,
}: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header style={{
      height: "64px",
      padding: "0 1.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid var(--border-card)",
      background: "rgba(11, 15, 25, 0.85)",
      backdropFilter: "var(--glass-blur)",
      position: "sticky",
      top: 0,
      zIndex: 9,
    }}>
      {/* Title & Refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Aktualizovat data z Heliosu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              transition: "all 0.2s ease",
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-pulse-glow" : ""} />
          </button>
        )}
      </div>

      {/* Profile & Context */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* DB Profile Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "9999px",
          background: "rgba(6, 182, 212, 0.12)",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          color: "var(--accent-cyan)",
          fontSize: "0.775rem",
          fontWeight: 600,
        }}>
          <Database size={13} />
          <span>Profil: {dbProfile}</span>
        </div>

        {/* Language Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.35rem 0.65rem",
          borderRadius: "var(--radius-md)",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
          fontSize: "0.775rem",
          fontWeight: 500,
        }}>
          <Globe size={13} />
          <span>CZ</span>
        </div>

        {/* User Info */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          paddingLeft: "0.5rem",
          borderLeft: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.3))",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}>
            <User size={16} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.2 }}>{userName}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", lineHeight: 1.2 }}>Uživatel Helios</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Odhlásit se"
          className="btn btn-secondary"
          style={{ padding: "0.45rem 0.8rem", fontSize: "0.8rem" }}
        >
          <LogOut size={15} />
          <span>Odhlásit</span>
        </button>
      </div>
    </header>
  );
}
