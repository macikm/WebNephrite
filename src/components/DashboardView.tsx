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
  FolderArchive,
  RefreshCw,
  ChevronsRight,
  ExternalLink,
  Plus,
  BookOpen
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

  // Worklist items (e.g. recent invoices to review or pay)
  const worklistItems = [...invoicesIssued].slice(0, 8);

  const tiles = [
    {
      id: "invoices_issued",
      title: "Faktury vydané",
      subtitle: `${invoicesIssued.length} dokladů`,
      hasAdd: true,
      bg: "linear-gradient(135deg, #1e3a8a, #0284c7)",
      tab: "invoices_issued" as TabId,
    },
    {
      id: "orders",
      title: "Objednávky",
      subtitle: "Nákup a prodej",
      hasAdd: true,
      bg: "linear-gradient(135deg, #0f766e, #0d9488)",
      tab: "orders" as TabId,
    },
    {
      id: "products",
      title: "Sklad a produkty",
      subtitle: `${products.length} položek v ceníku`,
      hasAdd: false,
      bg: "linear-gradient(135deg, #374151, #4b5563)",
      tab: "products" as TabId,
    },
    {
      id: "customers",
      title: "Zákazníci & Partneři",
      subtitle: "Adresář CRM",
      hasAdd: false,
      bg: "linear-gradient(135deg, #1e293b, #334155)",
      tab: "customers" as TabId,
    },
    {
      id: "jobs",
      title: "Zakázky & Úkoly",
      subtitle: "Plnění a realizace",
      hasAdd: true,
      bg: "linear-gradient(135deg, #065f46, #059669)",
      tab: "jobs" as TabId,
    },
    {
      id: "invoices_received",
      title: "Faktury přijaté",
      subtitle: `${invoicesReceived.length} dokladů`,
      hasAdd: false,
      bg: "linear-gradient(135deg, #831843, #be185d)",
      tab: "invoices_received" as TabId,
    },
    {
      id: "documents",
      title: "DMS Dokumenty",
      subtitle: "Archiv a přílohy",
      hasAdd: false,
      bg: "linear-gradient(135deg, #431407, #9a3412)",
      tab: "documents" as TabId,
    },
    {
      id: "settings",
      title: "Systém & Helios API",
      subtitle: "Konfigurace & logy",
      hasAdd: false,
      bg: "linear-gradient(135deg, #1e1b4b, #4338ca)",
      tab: "settings" as TabId,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Centered Big Heading matching Screenshot 1 */}
      <div style={{ textAlign: "center", margin: "0.25rem 0 0.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          ASOL Portál
        </h1>
      </div>

      {/* Asseco Learning / Helios modern Banner matching Screenshot 1 */}
      <div style={{
        background: "linear-gradient(90deg, #043657 0%, #035284 35%, #0284c7 100%)",
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 2rem",
        color: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        flexWrap: "wrap",
        gap: "1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            flexShrink: 0,
          }}>
            <BookOpen size={28} />
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Asseco Learning
            </div>
            <div style={{ fontSize: "0.95rem", opacity: 0.9, marginTop: "0.2rem" }}>
              Nový vzdělávací portál a Helios Nephrite integrace pro zaměstnance
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate("invoices_issued")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "9999px",
            background: "#ffffff",
            color: "#035284",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
          }}
        >
          <span>Přejít k dokladům</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Grid of 8 Quick Action Tiles matching Screenshot 1 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "0.85rem",
      }}>
        {tiles.map((tile) => (
          <div
            key={tile.id}
            onClick={() => onNavigate(tile.tab)}
            style={{
              position: "relative",
              height: "85px",
              borderRadius: "8px",
              background: tile.bg,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "flex-end",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            {/* Dark gradient overlay for readability */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)",
              zIndex: 1,
            }} />

            <div style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              color: "#ffffff",
            }}>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                  {tile.title}
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.85, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                  {tile.subtitle}
                </div>
              </div>

              {tile.hasAdd && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.2)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}>
                  <span>Přejít</span>
                  <span>➔</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ASOL "Worklist" Card & Table Widget matching Screenshot 1 */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Worklist Header */}
        <div style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
            Worklist (Poslední otevřené doklady)
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => onNavigate("invoices_issued")}
              title="Obnovit data"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => onNavigate("invoices_issued")}
              title="Zobrazit všechny doklady"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

        {/* Worklist Table matching Screenshot 1 */}
        <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Číslo dokladu</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Název partnera</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "130px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Reference / VS</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "130px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Částka</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "110px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Vystaveno</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "110px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Splatnost</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "100px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Stav</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>▼</span>
                  </div>
                </th>
                <th style={{ width: "80px", textAlign: "center" }}>
                  <span>Otevřít</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {worklistItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                    Nejsou žádné další položky
                  </td>
                </tr>
              ) : (
                worklistItems.map((inv) => {
                  const isPaid = inv.invPaymentStatusCode === "paid";
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onNavigate("invoices_issued")}
                    >
                      <td style={{ fontWeight: 600, color: "#0284c7" }}>
                        {inv.invoiceNo || inv.number || `#${inv.id}`}
                      </td>
                      <td>{safeString(inv.customer?.name, "Bez partnera")}</td>
                      <td>{safeString(inv.variableSymbol, "—")}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {safeCurrency(inv.totalAmount)}
                      </td>
                      <td>{safeDate(inv.issueDate)}</td>
                      <td>{safeDate(inv.dueDate)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${isPaid ? "badge-paid" : "badge-unpaid"}`}>
                          {isPaid ? "Uhrazeno" : "Neuhrazeno"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ color: "#0284c7", fontSize: "0.8rem", fontWeight: 600 }}>
                          Detail ➔
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
