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
  Briefcase,
  TrendingUp,
  CreditCard,
  Building,
  Server
} from "lucide-react";
import { Invoice, Product, UserInfo } from "@/types/helios";
import { TabId } from "./Sidebar";
import { safeCurrency, safeDate, safeNumber, safeString } from "@/lib/table-utils";

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

  const receivedOutstanding = invoicesReceived.reduce((sum, inv) => {
    const isPaid = inv.invPaymentStatusCode === "paid";
    const amt = inv.outstandingAmount != null 
      ? Number(inv.outstandingAmount) 
      : (isPaid ? 0 : Number(inv.totalAmount) || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);
  const receivedTotal = invoicesReceived.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const unpaidReceivedCount = invoicesReceived.filter(i => i.invPaymentStatusCode !== "paid").length;

  const recentInvoices = [...invoicesIssued].slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Welcome Banner */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        borderLeft: "4px solid #0284c7",
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0284c7" }}>
            HELIOS NEPHRITE CLIENT
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1e293b", marginTop: "0.2rem", letterSpacing: "-0.01em" }}>
            Přehled systému & KPI
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Aktivní profil: <strong style={{ color: "#0284c7" }}>{userInfo?.dbprofile || "Demo"}</strong> • 
            Uživatel: <strong style={{ color: "#334155" }}>{userInfo?.userName || "tester"}</strong> • 
            Server: <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>open.helios.eu</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => onNavigate("invoices_issued")}
            className="asol-btn"
            style={{ background: "#f0f9ff", color: "#0284c7", borderColor: "#bae6fd", fontWeight: 700 }}
          >
            <span>Vydané faktury</span>
            <ArrowUpRight size={15} />
          </button>
          <button
            onClick={() => onNavigate("products")}
            className="asol-btn"
          >
            <span>Katalog produktů</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}>
        {/* Card 1: Vydané faktury */}
        <div 
          onClick={() => onNavigate("invoices_issued")}
          className="kpi-card" 
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Pohledávky (Vydané faktury)
            </span>
            <div style={{ padding: "0.4rem", borderRadius: "6px", background: "#e0f2fe", color: "#0284c7" }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "#0284c7" }}>
            {safeCurrency(issuedOutstanding)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: unpaidIssuedCount > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
              {unpaidIssuedCount} neuhrazených
            </span>
            <span>•</span>
            <span>Celkem: {safeCurrency(issuedTotal)}</span>
          </div>
        </div>

        {/* Card 2: Přijaté faktury */}
        <div 
          onClick={() => onNavigate("invoices_received")}
          className="kpi-card" 
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Závazky (Přijaté faktury)
            </span>
            <div style={{ padding: "0.4rem", borderRadius: "6px", background: "#fef3c7", color: "#d97706" }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "#d97706" }}>
            {safeCurrency(receivedOutstanding)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: unpaidReceivedCount > 0 ? "#d97706" : "#16a34a", fontWeight: 600 }}>
              {unpaidReceivedCount} neuhrazených
            </span>
            <span>•</span>
            <span>Celkem: {safeCurrency(receivedTotal)}</span>
          </div>
        </div>

        {/* Card 3: Produkty a ceníky */}
        <div 
          onClick={() => onNavigate("products")}
          className="kpi-card" 
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Katalog produktů & Sklad
            </span>
            <div style={{ padding: "0.4rem", borderRadius: "6px", background: "#f0fdf4", color: "#16a34a" }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-val" style={{ color: "#16a34a" }}>
            {products.length}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Aktivních ceníkových položek a služeb
          </div>
        </div>

        {/* Card 4: Helios integrace */}
        <div 
          onClick={() => onNavigate("settings")}
          className="kpi-card" 
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Stav propojení
            </span>
            <div style={{ padding: "0.4rem", borderRadius: "6px", background: "#f3e8ff", color: "#7c3aed" }}>
              <Server size={18} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a" }} />
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>Helios Online</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            REST API v1 • Autorizováno
          </div>
        </div>
      </div>

      {/* Main Table: Poslední vystavené faktury */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          padding: "0.85rem 1.25rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
              Poslední vystavené faktury
            </h3>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Rychlý přehled nejnovějších obchodních dokladů
            </div>
          </div>

          <button
            onClick={() => onNavigate("invoices_issued")}
            className="asol-btn"
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
          >
            <span>Zobrazit všechny</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Číslo dokladu</th>
                <th>Odběratel / Partner</th>
                <th style={{ width: "130px" }}>Variabilní symbol</th>
                <th style={{ width: "110px" }}>Vystaveno</th>
                <th style={{ width: "110px" }}>Splatnost</th>
                <th style={{ width: "130px", textAlign: "right" }}>Částka</th>
                <th style={{ width: "110px", textAlign: "center" }}>Stav</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    Žádné doklady k zobrazení.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => {
                  const isPaid = inv.invPaymentStatusCode === "paid";
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onNavigate("invoices_issued")}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: 600, color: "#0284c7", fontFamily: "var(--font-mono)" }}>
                        {inv.invoiceNo || inv.number || `#${inv.id}`}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {safeString(inv.customer?.name, "Bez partnera")}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "#64748b" }}>
                        {safeString(inv.variableSymbol, "—")}
                      </td>
                      <td>{safeDate(inv.issueDate)}</td>
                      <td style={{ fontWeight: !isPaid ? 600 : 400, color: !isPaid ? "#d97706" : "#64748b" }}>
                        {safeDate(inv.dueDate)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {safeCurrency(inv.totalAmount)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${isPaid ? "badge-paid" : "badge-unpaid"}`}>
                          {isPaid ? "Uhrazeno" : "Neuhrazeno"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
