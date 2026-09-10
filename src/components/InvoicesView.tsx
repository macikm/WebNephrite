"use client";

import { useState } from "react";
import { Invoice } from "@/types/helios";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  X, 
  Building, 
  CreditCard, 
  Calendar, 
  FileText,
  DollarSign
} from "lucide-react";

interface InvoicesViewProps {
  invoicesIssued: Invoice[];
  invoicesReceived: Invoice[];
  activeType: "issued" | "received";
  onChangeType: (type: "issued" | "received") => void;
  isLoading: boolean;
}

export function InvoicesView({
  invoicesIssued,
  invoicesReceived,
  activeType,
  onChangeType,
  isLoading,
}: InvoicesViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const currentList = activeType === "issued" ? invoicesIssued : invoicesReceived;

  const filteredInvoices = currentList.filter((inv) => {
    const term = search.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      (inv.number && inv.number.toLowerCase().includes(term)) ||
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(term)) ||
      (inv.variableSymbol && inv.variableSymbol.includes(term)) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(term));

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "unpaid" && inv.invPaymentStatusCode === "unpaid") ||
      (statusFilter === "paid" && inv.invPaymentStatusCode === "paid");

    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, i) => sum + (Number(i.outstandingAmount) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 2 }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("cs-CZ");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Type Toggle & Search Controls */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          {/* Subtabs */}
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
            <button
              onClick={() => onChangeType("issued")}
              className={`btn ${activeType === "issued" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <span>Vydané faktury ({invoicesIssued.length})</span>
            </button>
            <button
              onClick={() => onChangeType("received")}
              className={`btn ${activeType === "received" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <span>Přijaté faktury ({invoicesReceived.length})</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 340px", maxWidth: "550px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                placeholder="Hledat podle čísla, VS, odběratele..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Filter size={15} style={{ color: "var(--text-dim)" }} />
              <select
                className="input-control"
                style={{ fontSize: "0.85rem", width: "auto" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Všechny stavy</option>
                <option value="unpaid">Neuhrazené</option>
                <option value="paid">Uhrazené</option>
              </select>
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div style={{
          marginTop: "1.25rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          fontSize: "0.85rem",
        }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Zobrazeno záznamů: </span>
            <strong style={{ color: "var(--text-main)" }}>{filteredInvoices.length}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Fakturovaná částka: </span>
            <strong style={{ color: "var(--brand-primary)" }}>{formatCurrency(totalAmount)}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Zbývá uhradit: </span>
            <strong style={{ color: totalOutstanding > 0 ? "var(--accent-rose)" : "var(--status-paid)" }}>
              {formatCurrency(totalOutstanding)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Číslo dokladu</th>
                <th>Variabilní symbol</th>
                <th>Partner / Klient</th>
                <th>Vystaveno</th>
                <th>Splatnost</th>
                <th>Celková částka</th>
                <th>Zbývá uhradit</th>
                <th>Stav úhrady</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Načítám faktury z Helios Nephrite...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Nebyly nalezeny žádné faktury odpovídající zadaným kritériím.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.invPaymentStatusCode === "paid";
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {inv.invoiceNo || inv.number}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {inv.variableSymbol || "—"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.customer?.name || "Nespecifikováno"}</div>
                        {inv.tin && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>IČ/DIČ: {inv.tin}</div>}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{formatDate(inv.issueDate)}</td>
                      <td style={{ color: !isPaid ? "var(--accent-amber)" : "var(--text-muted)", fontWeight: !isPaid ? 600 : 400 }}>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td style={{ fontWeight: 600, color: inv.outstandingAmount > 0 ? "var(--accent-rose)" : "var(--status-paid)" }}>
                        {formatCurrency(inv.outstandingAmount)}
                      </td>
                      <td>
                        {isPaid ? (
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
                      <td>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "1.5rem",
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative",
            background: "rgba(18, 26, 42, 0.98)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.2)",
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--brand-primary)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  {activeType === "issued" ? "Vydaná faktura" : "Přijatá faktura"}
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem" }}>
                  {selectedInvoice.invoiceNo || selectedInvoice.number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Partner & Bank info */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                background: "rgba(10, 15, 25, 0.6)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Building size={13} />
                    <span>Odběratel / Partner</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.25rem" }}>
                    {selectedInvoice.customer?.name || "Nezadáno"}
                  </div>
                  {selectedInvoice.tin && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      IČ/DIČ: {selectedInvoice.tin}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <CreditCard size={13} />
                    <span>Platební údaje</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    VS: <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedInvoice.variableSymbol || "—"}</strong>
                  </div>
                  {selectedInvoice.bankAccount && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      Účet: {selectedInvoice.bankAccount.accountNo}/{selectedInvoice.bankAccount.bankCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates & Timeline */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
                fontSize: "0.825rem",
              }}>
                <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={12} />
                    <span>Datum vystavení</span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{formatDate(selectedInvoice.issueDate)}</div>
                </div>

                <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={12} />
                    <span>Datum splatnosti</span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "0.2rem", color: selectedInvoice.invPaymentStatusCode === "unpaid" ? "var(--accent-rose)" : "inherit" }}>
                    {formatDate(selectedInvoice.dueDate)}
                  </div>
                </div>

                <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={12} />
                    <span>DUZP</span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{formatDate(selectedInvoice.vatDate)}</div>
                </div>
              </div>

              {/* Job / Department metadata */}
              {(selectedInvoice.jobOrder || selectedInvoice.department) && (
                <div style={{
                  display: "flex",
                  gap: "1.5rem",
                  fontSize: "0.825rem",
                  color: "var(--text-muted)",
                }}>
                  {selectedInvoice.jobOrder && (
                    <div>
                      <span>Zakázka: </span>
                      <strong style={{ color: "var(--text-main)" }}>
                        {selectedInvoice.jobOrder.number} ({selectedInvoice.jobOrder.name})
                      </strong>
                    </div>
                  )}
                  {selectedInvoice.department && (
                    <div>
                      <span>Středisko: </span>
                      <strong style={{ color: "var(--text-main)" }}>
                        {selectedInvoice.department.number} - {selectedInvoice.department.name}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              {selectedInvoice.note && (
                <div style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  color: "var(--text-muted)",
                }}>
                  Poznámka: {selectedInvoice.note}
                </div>
              )}

              {/* Amounts & Payment Status Card */}
              <div style={{
                marginTop: "0.5rem",
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Stav dokladu:</div>
                  <div style={{ marginTop: "0.25rem" }}>
                    {selectedInvoice.invPaymentStatusCode === "paid" ? (
                      <span className="badge badge-paid">
                        <CheckCircle2 size={13} />
                        <span>Faktura je kompletně uhrazena</span>
                      </span>
                    ) : (
                      <span className="badge badge-unpaid">
                        <Clock size={13} />
                        <span>Neuhrazeno • Zbývá: {formatCurrency(selectedInvoice.outstandingAmount)}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Celkem k úhradě:</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)" }}>
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn btn-secondary"
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
