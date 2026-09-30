"use client";

import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Package, 
  ShoppingCart, 
  Users, 
  Briefcase, 
  FolderArchive, 
  Settings,
  Home,
  ChevronRight
} from "lucide-react";

export type TabId = 
  | "dashboard" 
  | "invoices_issued" 
  | "invoices_received" 
  | "products" 
  | "orders" 
  | "customers" 
  | "jobs" 
  | "documents" 
  | "settings";

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  dbProfile?: string;
}

export function Sidebar({ currentTab, onSelectTab, dbProfile = "Demo" }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, category: "Přehled" },
    { id: "invoices_issued", label: "Faktury vydané", icon: FileText, category: "Finance" },
    { id: "invoices_received", label: "Faktury přijaté", icon: Receipt, category: "Finance" },
    { id: "products", label: "Katalog & Sklad", icon: Package, category: "Obchod" },
    { id: "orders", label: "Objednávky", icon: ShoppingCart, category: "Obchod" },
    { id: "customers", label: "Zákazníci & Partneři", icon: Users, category: "CRM" },
    { id: "jobs", label: "Zakázky & Úkoly", icon: Briefcase, category: "Realizace" },
    { id: "documents", label: "Dokumenty DMS", icon: FolderArchive, category: "Správa" },
    { id: "settings", label: "Systém & API", icon: Settings, category: "Správa" },
  ];

  const categories = ["Přehled", "Finance", "Obchod", "CRM", "Realizace", "Správa"];

  return (
    <aside style={{
      width: "250px",
      minWidth: "250px",
      height: "100vh",
      background: "#ffffff",
      borderRight: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      zIndex: 10,
      boxShadow: "1px 0 3px rgba(0, 0, 0, 0.03)",
    }}>
      {/* Brand logo in Asseco style with Home button */}
      <div style={{
        padding: "1rem 1.15rem",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "#ffffff",
      }}>
        {/* Blue Home Icon Button matching ASOL portal header */}
        <button
          onClick={() => onSelectTab("dashboard")}
          title="Přejít na Dashboard"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            background: "#e0f2fe",
            border: "1px solid #bae6fd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0284c7",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#bae6fd";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#e0f2fe";
          }}
        >
          <Home size={18} />
        </button>

        <div>
          {/* Asseco wordmark style */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#1e293b", fontFamily: "sans-serif" }}>
              asseco
            </span>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", color: "#0284c7", textTransform: "uppercase", marginLeft: "4px" }}>
              SOLUTIONS
            </span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>Helios ERP</span>
            <span>•</span>
            <span style={{ color: "#0284c7", fontWeight: 600 }}>{dbProfile}</span>
          </div>
        </div>
      </div>

      {/* Navigation items grouped by category */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "0.85rem 0.65rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        {categories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat);
          if (!items.length) return null;

          return (
            <div key={cat}>
              <div style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#94a3b8",
                padding: "0 0.6rem 0.35rem",
              }}>
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id as TabId)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "5px",
                        fontSize: "0.825rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#0284c7" : "#334155",
                        background: isActive ? "#e0f2fe" : "transparent",
                        borderLeft: isActive ? "3px solid #0284c7" : "3px solid transparent",
                        transition: "all 0.12s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "#0f172a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#334155";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Icon size={16} style={{ color: isActive ? "#0284c7" : "#0284c7" }} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} style={{ color: "#0284c7" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer System Indicator */}
      <div style={{
        padding: "0.75rem 1rem",
        borderTop: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <div style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#16a34a",
            boxShadow: "0 0 6px #16a34a",
          }} />
          <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 500 }}>
            Helios Online
          </span>
        </div>
        <span style={{ fontSize: "0.675rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
          v48.2.3.0
        </span>
      </div>
    </aside>
  );
}
