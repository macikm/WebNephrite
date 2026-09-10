"use client";

import { 
  FileText, 
  Receipt, 
  Package, 
  Users, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Layers,
  ExternalLink
} from "lucide-react";
import { Invoice, Product, UserInfo } from "@/types/helios";
import { TabId } from "./Sidebar";

interface DashboardProps {
  invoicesIssued: Invoice[];
  invoicesReceived: Invoice[];
  products: Product[];
  userInfo?: UserInfo | null;
  onNavigate: (tab: TabId) => void;
  isLoading: boolean;
}

export function DashboardView({
  invoicesIssued,
  invoicesReceived,
  products,
  userInfo,
  onNavigate,
  isLoading,
}: DashboardProps) {
  // Compute metrics
  const issuedOutstanding = invoicesIssued.reduce((sum, inv) => sum + (Number(inv.outstandingAmount) || 0), 0);
  const issuedTotal = invoicesIssued.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const unpaidIssuedCount = invoicesIssued.filter(i => i.invPaymentStatusCode === "unpaid").length;

  const receivedOutstanding = invoicesReceived.reduce((sum, inv) => sum + (Number(inv.outstandingAmount) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(val);
  };

  const recentInvoices = [...invoicesIssued].slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Welcome Banner */}
      <div className="glass-panel glow-effect" style={{
        padding: "1.75rem 2rem",
        background: "linear-gradient(135deg, rgba(22, 30, 46, 0.9), rgba(16, 185, 129, 0.08))",
        borderLeft: "4px solid var(--brand-primary)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
            }}>
              HELIOS NEPHRITE CLOUD ERP
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Vítejte v systému, {userInfo?.userName || "uživateli"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            Databázový profil: <strong style={{ color: "var(--accent-cyan)" }}>{userInfo?.dbprofile || "Demo"}</strong> • 
            Aktivní období: <strong>2026</strong> • Server: <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>open.helios.eu</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => onNavigate("invoices_issued")}
            className="btn btn-primary"
          >
            <span>Vydané faktury</span>
            <ArrowUpRight size={16} />
          </button>
          <button
            onClick={() => onNavigate("products")}
            className="btn btn-secondary"
          >
            <span>Katalog produktů</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem",
      }}>
        {/* KPI 1: Neuhrazené pohledávky */}
        <div className="glass-panel kpi-card" onClick={() => onNavigate("invoices_issued")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Neuhrazené pohledávky
            </span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.15)",
              color: "var(--accent-rose)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: unpaidIssuedCount > 0 ? "var(--accent-rose)" : "var(--status-paid)" }}>
            {isLoading ? "..." : formatCurrency(issuedOutstanding)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            {unpaidIssuedCount} neuhrazených faktur vydaných
          </div>
        </div>

        {/* KPI 2: Celkový obrat (Vydané) */}
        <div className="glass-panel kpi-card" onClick={() => onNavigate("invoices_issued")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Celkem vyfakturováno
            </span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--status-paid)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "var(--brand-primary)" }}>
            {isLoading ? "..." : formatCurrency(issuedTotal)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            {invoicesIssued.length} evidovaných faktur
          </div>
        </div>

        {/* KPI 3: Závazky (Přijaté) */}
        <div className="glass-panel kpi-card" onClick={() => onNavigate("invoices_received")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Závazky k úhradě
            </span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "var(--accent-amber)" }}>
            {isLoading ? "..." : formatCurrency(receivedOutstanding)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Faktury od dodavatelů
          </div>
        </div>

        {/* KPI 4: Položky skladu */}
        <div className="glass-panel kpi-card" onClick={() => onNavigate("products")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Položky v katalogu
            </span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "var(--accent-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "var(--accent-blue)" }}>
            {isLoading ? "..." : products.length}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Aktivní produkty v Nephrite
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & System Status */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1.5rem",
      }}>
        {/* Recent Invoices Table */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Poslední vydané faktury</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Přehled realizovaných faktur a stav jejich úhrady
              </p>
            </div>
            <button
              onClick={() => onNavigate("invoices_issued")}
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span>Všechny faktury</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Číslo / Doklad</th>
                  <th>Odběratel</th>
                  <th>Datum splatnosti</th>
                  <th>Částka</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-dim)" }}>
                      {isLoading ? "Načítám faktury z Heliosu..." : "Žádné faktury k zobrazení"}
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {inv.invoiceNo || inv.number}
                      </td>
                      <td>{inv.customer?.name || "Nezadáno"}</td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("cs-CZ") : "—"}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td>
                        {inv.invPaymentStatusCode === "paid" ? (
                          <span className="badge badge-paid">
                            <CheckCircle2 size={12} />
                            <span>Uhrazeno</span>
                          </span>
                        ) : (
                          <span className="badge badge-unpaid">
                            <Clock size={12} />
                            <span>K úhradě</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links & Server Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Quick Actions Panel */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Rychlá navigace v ERP
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                onClick={() => onNavigate("orders")}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.65rem 0.9rem" }}
              >
                <Layers size={16} style={{ color: "var(--accent-cyan)" }} />
                <span>Přijaté & vydané objednávky</span>
              </button>
              <button
                onClick={() => onNavigate("customers")}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.65rem 0.9rem" }}
              >
                <Users size={16} style={{ color: "var(--accent-purple)" }} />
                <span>Adresář zákazníků a partnerů</span>
              </button>
              <button
                onClick={() => onNavigate("jobs")}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.65rem 0.9rem" }}
              >
                <FileText size={16} style={{ color: "var(--accent-amber)" }} />
                <span>Zakázky a realizace úkolů</span>
              </button>
              <button
                onClick={() => onNavigate("settings")}
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.65rem 0.9rem" }}
              >
                <Server size={16} style={{ color: "var(--brand-primary)" }} />
                <span>API diagnostika & Swagger</span>
              </button>
            </div>
          </div>

          {/* Connected Server Card */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Server size={16} style={{ color: "var(--brand-primary)" }} />
              <span>Stav Helios konektoru</span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.825rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Protokol:</span>
                <span style={{ fontWeight: 600 }}>Web.API v8.0 ServiceGate</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Autentizace:</span>
                <span className="badge badge-paid" style={{ padding: "0.15rem 0.5rem" }}>Aktivní session</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Swagger Docs:</span>
                <a
                  href="https://demo-api.helios.eu/docs/index.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--accent-cyan)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Otevřít dokumentaci</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
