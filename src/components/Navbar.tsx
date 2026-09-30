"use client";

import { LogOut, User, Database, RefreshCw, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavbarProps {
  title: string;
  userName?: string;
  dbProfile?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenSettings?: () => void;
}

export function Navbar({
  title,
  userName = "tester",
  dbProfile = "Demo",
  onRefresh,
  isRefreshing = false,
  onOpenSettings,
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
      height: "56px",
      padding: "0 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #e2e8f0",
      background: "#ffffff",
      position: "sticky",
      top: 0,
      zIndex: 9,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    }}>
      {/* Title & Refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" }}>
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
              width: "30px",
              height: "30px",
              borderRadius: "5px",
              background: "#f8fafc",
              color: "#64748b",
              border: "1px solid #cbd5e1",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-pulse-glow" : ""} />
          </button>
        )}
      </div>

      {/* Right Controls: User info, Profile, Logout button & Settings gear matching ASOL portal */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* DB Profile Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.25rem 0.65rem",
          borderRadius: "5px",
          background: "#e0f2fe",
          border: "1px solid #bae6fd",
          color: "#0284c7",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}>
          <Database size={12} />
          <span>Profil: {dbProfile}</span>
        </div>

        {/* User dropdown appearance */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "5px",
          color: "#334155",
          fontSize: "0.825rem",
          fontWeight: 600,
        }}>
          <User size={15} style={{ color: "#0284c7" }} />
          <span>{userName}</span>
        </div>

        {/* ASOL Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Odhlásit ze systému"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#334155",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#94a3b8";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.color = "#334155";
          }}
        >
          <LogOut size={14} />
          <span>{loggingOut ? "Odhlašuji..." : "Odhlásit"}</span>
        </button>

        {/* ASOL Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          title="Nastavení systému"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#475569",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#94a3b8";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
