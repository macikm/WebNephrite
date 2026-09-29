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
  Eye,
  Plus,
  Edit3
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { InvoiceFormModal } from "./forms/InvoiceFormModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { Customer, Product } from "@/types/helios";
import { 
  SortDirection, 
  sortData, 
  safeString, 
  safeNumber, 
  safeDate, 
  safeCurrency 
} from "@/lib/table-utils";

interface InvoicesViewProps {
  invoicesIssued: Invoice[];
  invoicesReceived: Invoice[];
  activeType: "issued" | "received";
  onChangeType: (type: "issued" | "received") => void;
  isLoading: boolean;
  customers?: Customer[];
  products?: Product[];
  onSaveInvoice?: (invoice: Invoice) => void;
}

export function InvoicesView({
  invoicesIssued,
  invoicesReceived,
  activeType,
  onChangeType,
  isLoading,
  customers = [],
  products = [],
  onSaveInvoice,
}: InvoicesViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>("issueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const currentList = activeType === "issued" ? invoicesIssued : invoicesReceived;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Filter
  const filteredInvoices = currentList.filter((inv) => {
    const term = search.toLowerCase().trim();
    const invoiceNum = safeString(inv.invoiceNo || inv.number, "").toLowerCase();
    const vs = safeString(inv.variableSymbol, "").toLowerCase();
    const custName = safeString(inv.customer?.name, "").toLowerCase();

    const matchesSearch = !term || invoiceNum.includes(term) || vs.includes(term) || custName.includes(term);

    const isPaid = inv.invPaymentStatusCode === "paid";
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "unpaid" && !isPaid) ||
      (statusFilter === "paid" && isPaid);

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sortedInvoices = sortData(filteredInvoices, sortKey, sortDirection);

  // Pagination slice
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalAmount = filteredInvoices.reduce((sum, i) => sum + safeNumber(i.totalAmount, 0), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, i) => sum + safeNumber(i.outstandingAmount, 0), 0);

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení faktur">
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

              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setIsFormOpen(true);
                }}
                className="btn btn-primary"
                style={{ whiteSpace: "nowrap", padding: "0.55rem 1rem", fontSize: "0.85rem", gap: "0.4rem" }}
              >
                <Plus size={16} />
                <span>{activeType === "issued" ? "Vystavit fakturu" : "Zadat fakturu"}</span>
              </button>
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
            flexWrap: "wrap",
          }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Zobrazeno záznamů: </span>
              <strong style={{ color: "var(--text-main)" }}>{filteredInvoices.length}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Fakturovaná částka: </span>
              <strong style={{ color: "var(--brand-primary)" }}>{safeCurrency(totalAmount)}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Zbývá uhradit: </span>
              <strong style={{ color: totalOutstanding > 0 ? "var(--accent-rose)" : "var(--status-paid)" }}>
                {safeCurrency(totalOutstanding)}
              </strong>
            </div>
          </div>
        </div>

        {/* Main Table with Horizontal Scroll */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div className="table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "85px", textAlign: "center" }}>Detail</th>
                  <SortableHeader
                    label="Číslo dokladu"
                    columnKey="invoiceNo"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Variabilní symbol"
                    columnKey="variableSymbol"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Partner / Klient"
                    columnKey="customer.name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Vystaveno"
                    columnKey="issueDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Splatnost"
                    columnKey="dueDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Celková částka"
                    columnKey="totalAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Zbývá uhradit"
                    columnKey="outstandingAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Stav úhrady"
                    columnKey="invPaymentStatusCode"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám faktury z Helios Nephrite...
                    </td>
                  </tr>
                ) : sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Nebyly nalezeny žádné faktury odpovídající zadaným kritériím.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => {
                    const isPaid = inv.invPaymentStatusCode === "paid";
                    const docNum = safeString(inv.invoiceNo || inv.number, `#${inv.id}`);
                    const vs = safeString(inv.variableSymbol, "—");
                    const partner = safeString(inv.customer?.name, "Nezadáno");
                    const total = safeNumber(inv.totalAmount, 0);
                    const outstanding = safeNumber(inv.outstandingAmount, 0);

                    return (
                      <tr key={inv.id}>
                        {/* Detail and Edit in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Zobrazit detail faktury"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingInvoice(inv);
                                setIsFormOpen(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Upravit fakturu"
                            >
                              <Edit3 size={13} />
                              <span>Upravit</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {docNum}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {vs}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{partner}</div>
                          {inv.tin && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>IČ/DIČ: {safeString(inv.tin)}</div>}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{safeDate(inv.issueDate)}</td>
                        <td style={{ color: !isPaid ? "var(--accent-amber)" : "var(--text-muted)", fontWeight: !isPaid ? 600 : 400 }}>
                          {safeDate(inv.dueDate)}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {safeCurrency(total)}
                        </td>
                        <td style={{ fontWeight: 600, color: outstanding > 0 ? "var(--accent-rose)" : "var(--status-paid)" }}>
                          {safeCurrency(outstanding)}
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedInvoices.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Robust Detail Modal */}
        {selectedInvoice && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedInvoice(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "680px", padding: "2rem" }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--brand-primary)", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {activeType === "issued" ? "Vydaná faktura" : "Přijatá faktura"}
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem" }}>
                    {safeString(selectedInvoice.invoiceNo || selectedInvoice.number, `#${selectedInvoice.id}`)}
                  </h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      const inv = selectedInvoice;
                      setSelectedInvoice(null);
                      setEditingInvoice(inv);
                      setIsFormOpen(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", gap: "0.35rem" }}
                  >
                    <Edit3 size={14} />
                    <span>Upravit fakturu</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                    title="Zavřít detail"
                  >
                    <X size={18} />
                  </button>
                </div>
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
                      {safeString(selectedInvoice.customer?.name, "Nezadáno")}
                    </div>
                    {selectedInvoice.tin && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        IČ/DIČ: {safeString(selectedInvoice.tin)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <CreditCard size={13} />
                      <span>Platební údaje</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      VS: <strong style={{ fontFamily: "var(--font-mono)" }}>{safeString(selectedInvoice.variableSymbol, "—")}</strong>
                    </div>
                    {selectedInvoice.bankAccount && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        Účet: {safeString(selectedInvoice.bankAccount.accountNo)}/{safeString(selectedInvoice.bankAccount.bankCode)}
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
                    <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{safeDate(selectedInvoice.issueDate)}</div>
                  </div>

                  <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Calendar size={12} />
                      <span>Datum splatnosti</span>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: "0.2rem", color: selectedInvoice.invPaymentStatusCode === "unpaid" ? "var(--accent-rose)" : "inherit" }}>
                      {safeDate(selectedInvoice.dueDate)}
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Calendar size={12} />
                      <span>DUZP</span>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{safeDate(selectedInvoice.vatDate)}</div>
                  </div>
                </div>

                {/* Job / Department metadata */}
                {(selectedInvoice.jobOrder || selectedInvoice.department) && (
                  <div style={{
                    display: "flex",
                    gap: "1.5rem",
                    fontSize: "0.825rem",
                    color: "var(--text-muted)",
                    flexWrap: "wrap",
                  }}>
                    {selectedInvoice.jobOrder && (
                      <div>
                        <span>Zakázka: </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {safeString(selectedInvoice.jobOrder.number)} ({safeString(selectedInvoice.jobOrder.name)})
                        </strong>
                      </div>
                    )}
                    {selectedInvoice.department && (
                      <div>
                        <span>Středisko: </span>
                        <strong style={{ color: "var(--text-main)" }}>
                          {safeString(selectedInvoice.department.number)} - {safeString(selectedInvoice.department.name)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Note */}
                {selectedInvoice.note && typeof selectedInvoice.note === "string" && selectedInvoice.note.trim() && (
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
                          <span>Neuhrazeno • Zbývá: {safeCurrency(selectedInvoice.outstandingAmount)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Celkem k úhradě:</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)" }}>
                      {safeCurrency(selectedInvoice.totalAmount)}
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

        {/* Invoice Creation & Editing Modal */}
        <InvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={(saved) => {
            onSaveInvoice?.(saved);
            setIsFormOpen(false);
          }}
          initialInvoice={editingInvoice}
          defaultType={activeType}
          customers={customers}
          products={products}
        />
      </div>
    </ErrorBoundary>
  );
}
