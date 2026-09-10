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
  ShieldCheck,
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
    { id: "products", label: "Produkty & Sklad", icon: Package, category: "Obchod" },
    { id: "orders", label: "Objednávky", icon: ShoppingCart, category: "Obchod" },
    { id: "customers", label: "Zákazníci & Partneři", icon: Users, category: "CRM" },
    { id: "jobs", label: "Zakázky & Úkoly", icon: Briefcase, category: "Realizace" },
    { id: "documents", label: "Dokumenty DMS", icon: FolderArchive, category: "Správa" },
    { id: "settings", label: "Systém & API", icon: Settings, category: "Správa" },
  ];

  const categories = ["Přehled", "Finance", "Obchod", "CRM", "Realizace", "Správa"];

  return (
    <aside style={{
      width: "260px",
      minWidth: "260px",
      height: "100vh",
      background: "rgba(14, 20, 32, 0.95)",
      borderRight: "1px solid var(--border-card)",
      display: "flex",
      flexDirection: "column",
      zIndex: 10,
    }}>
      {/* Brand logo */}
      <div style={{
        padding: "1.25rem 1.25rem 1rem",
        borderBottom: "1px solid var(--border-card)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          background: "linear-gradient(135deg, var(--brand-primary), #059669)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: "0 0 15px rgba(16, 185, 129, 0.35)",
        }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            Web<span style={{ color: "var(--brand-primary)" }}>Nephrite</span>
          </div>
          <div style={{ fontSize: "0.725rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span>Helios ERP</span>
            <span>•</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{dbProfile}</span>
          </div>
        </div>
      </div>

      {/* Navigation items grouped by category */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem 0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}>
        {categories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat);
          if (!items.length) return null;

          return (
            <div key={cat}>
              <div style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-dim)",
                padding: "0 0.6rem 0.4rem",
              }}>
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
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
                        padding: "0.55rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.85rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#ffffff" : "var(--text-muted)",
                        background: isActive 
                          ? "linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))" 
                          : "transparent",
                        borderLeft: isActive ? "3px solid var(--brand-primary)" : "3px solid transparent",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                          e.currentTarget.style.color = "var(--text-main)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <Icon size={17} style={{ color: isActive ? "var(--brand-primary)" : "inherit" }} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} style={{ color: "var(--brand-primary)" }} />}
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
        padding: "0.85rem 1rem",
        borderTop: "1px solid var(--border-card)",
        background: "rgba(11, 15, 25, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--brand-primary)",
            boxShadow: "0 0 8px var(--brand-primary)",
          }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
            API Online
          </span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          v8.0.24-rc
        </span>
      </div>
    </aside>
  );
}
