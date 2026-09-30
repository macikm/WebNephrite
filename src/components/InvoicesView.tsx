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
  Edit3,
  ChevronDown,
  Download,
  CheckSquare
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
import { useEscapeKey } from "@/lib/useEscapeKey";

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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEscapeKey(() => {
    if (selectedInvoice) setSelectedInvoice(null);
  }, Boolean(selectedInvoice));
  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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
    const custName = safeString(inv.supplier?.name || inv.customer?.name, "").toLowerCase();
    const tinStr = safeString(inv.tin || inv.supplier?.vatId || inv.supplier?.idNumber || inv.customer?.vatId, "").toLowerCase();

    const matchesSearch = !term || invoiceNum.includes(term) || vs.includes(term) || custName.includes(term) || tinStr.includes(term);

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
  const totalOutstanding = filteredInvoices.reduce((sum, i) => {
    const isPaid = i.invPaymentStatusCode === "paid";
    const out = i.outstandingAmount != null ? safeNumber(i.outstandingAmount, 0) : (isPaid ? 0 : safeNumber(i.totalAmount, 0));
    return sum + out;
  }, 0);

  // Currently selected invoice object
  const activeSelected = currentList.find(i => i.id === selectedRowId) || null;

  const handleEditSelected = () => {
    if (activeSelected) {
      setEditingInvoice(activeSelected);
      setIsFormOpen(true);
    }
  };

  const handleExportCsv = () => {
    const headers = "Cislo;VS;Partner;ICO_DIC;Vystaveno;Splatnost;Castka;Zbyva;Stav\n";
    const rows = filteredInvoices.map(i => {
      const pName = i.supplier?.name || i.customer?.name || '';
      const pTin = i.tin || i.supplier?.vatId || i.customer?.vatId || '';
      const isPaid = i.invPaymentStatusCode === "paid";
      const out = i.outstandingAmount != null ? i.outstandingAmount : (isPaid ? 0 : i.totalAmount);
      return `"${i.invoiceNo || i.number || i.id}";"${i.variableSymbol || ''}";"${pName}";"${pTin}";"${safeDate(i.issueDate || i.receivedDate || i.transactionDate)}";"${safeDate(i.dueDate)}";"${i.totalAmount}";"${out}";"${i.invPaymentStatusCode}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `faktury_${activeType}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowActionsMenu(false);
  };

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení faktur">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* ASOL Breadcrumbs matching Screenshot 2 */}
        <div className="asol-breadcrumb">
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Finance</span>
          <span className="separator">/</span>
          <span className="current">{activeType === "issued" ? "Faktury vydané" : "Faktury přijaté"}</span>
        </div>

        {/* ASOL Action Bar above Table matching Screenshot 2 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          background: "#ffffff",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}>
          {/* Left Action Buttons: [+] [✎] [Akce ▾] + Type switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* New Button [+] */}
            <button
              onClick={() => {
                setEditingInvoice(null);
                setIsFormOpen(true);
              }}
              title={activeType === "issued" ? "Vystavit novou fakturu (+)" : "Zadat novou přijatou fakturu (+)"}
              className="asol-btn asol-btn-icon"
              style={{ fontWeight: 700, fontSize: "1.1rem" }}
            >
              <Plus size={18} />
            </button>

            {/* Edit Button [✎] */}
            <button
              onClick={handleEditSelected}
              disabled={!activeSelected}
              title={activeSelected ? `Upravit vybranou fakturu (${activeSelected.invoiceNo || activeSelected.id})` : "Vyberte fakturu v tabulce pro úpravu"}
              className="asol-btn asol-btn-icon"
            >
              <Edit3 size={16} />
            </button>

            {/* Actions Dropdown [Akce ▾] */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowActionsMenu(prev => !prev)}
                className="asol-btn"
                style={{ gap: "0.35rem" }}
              >
                <span>Akce</span>
                <ChevronDown size={14} />
              </button>

              {showActionsMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 20,
                  minWidth: "180px",
                  padding: "0.35rem 0",
                }}>
                  <button
                    onClick={handleExportCsv}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.5rem 1rem",
                      fontSize: "0.825rem",
                      color: "#334155",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Download size={14} />
                    <span>Export do CSV</span>
                  </button>
                  {activeSelected && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(activeSelected);
                        setShowActionsMenu(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.5rem 1rem",
                        fontSize: "0.825rem",
                        color: "#334155",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <Eye size={14} />
                      <span>Zobrazit detail dokladu</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ width: "1px", height: "24px", background: "#cbd5e1", margin: "0 0.25rem" }} />

            {/* Subtabs: Vydané / Přijaté */}
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                onClick={() => onChangeType("issued")}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: activeType === "issued" ? 700 : 500,
                  borderRadius: "5px",
                  background: activeType === "issued" ? "#e0f2fe" : "transparent",
                  color: activeType === "issued" ? "#0284c7" : "#64748b",
                  border: activeType === "issued" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Vydané ({invoicesIssued.length})
              </button>
              <button
                onClick={() => onChangeType("received")}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: activeType === "received" ? 700 : 500,
                  borderRadius: "5px",
                  background: activeType === "received" ? "#e0f2fe" : "transparent",
                  color: activeType === "received" ? "#0284c7" : "#64748b",
                  border: activeType === "received" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Přijaté ({invoicesReceived.length})
              </button>
            </div>
          </div>

          {/* Right Controls: Search input & Filter funnel button matching Screenshot 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2rem", paddingRight: "1.75rem", fontSize: "0.825rem", height: "34px" }}
                placeholder="Hledat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Funnel Button [∇] */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFilterDropdown(prev => !prev)}
                title="Filtr stavu úhrady"
                className="asol-btn asol-btn-icon"
                style={{
                  background: statusFilter !== "all" ? "#e0f2fe" : "#ffffff",
                  color: statusFilter !== "all" ? "#0284c7" : "#334155",
                  borderColor: statusFilter !== "all" ? "#bae6fd" : "#cbd5e1",
                }}
              >
                <Filter size={16} />
              </button>

              {showFilterDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 20,
                  minWidth: "160px",
                  padding: "0.4rem",
                }}>
                  <div style={{ fontSize: "0.725rem", fontWeight: 700, color: "#64748b", padding: "0.25rem 0.5rem", textTransform: "uppercase" }}>
                    Stav úhrady
                  </div>
                  {[
                    { val: "all", label: "Všechny doklady" },
                    { val: "unpaid", label: "Pouze neuhrazené" },
                    { val: "paid", label: "Pouze uhrazené" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setStatusFilter(opt.val as any);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        fontSize: "0.825rem",
                        borderRadius: "4px",
                        background: statusFilter === opt.val ? "#e0f2fe" : "transparent",
                        color: statusFilter === opt.val ? "#0284c7" : "#334155",
                        fontWeight: statusFilter === opt.val ? 600 : 400,
                      }}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.val && <CheckCircle2 size={13} style={{ color: "#0284c7" }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Reference / Číslo"
                    columnKey="invoiceNo"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "160px" }}
                  />
                  <SortableHeader
                    label="Variabilní symbol"
                    columnKey="variableSymbol"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "140px" }}
                  />
                  <SortableHeader
                    label={activeType === "issued" ? "Partner / Odběratel" : "Partner / Dodavatel"}
                    columnKey={activeType === "issued" ? "customer.name" : "supplier.name"}
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Datum vystavení"
                    columnKey="issueDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "120px" }}
                  />
                  <SortableHeader
                    label="Datum splatnosti"
                    columnKey="dueDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "120px" }}
                  />
                  <SortableHeader
                    label="Celková částka"
                    columnKey="totalAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "140px", textAlign: "right" }}
                  />
                  <SortableHeader
                    label="Zbývá uhradit"
                    columnKey="outstandingAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "140px", textAlign: "right" }}
                  />
                  <SortableHeader
                    label="Stav"
                    columnKey="invPaymentStatusCode"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "110px", textAlign: "center" }}
                  />
                  <th style={{ width: "90px", textAlign: "center" }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      Načítám faktury z Helios Nephrite...
                    </td>
                  </tr>
                ) : sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      Nebyly nalezeny žádné faktury odpovídající zadaným kritériím.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => {
                    const isPaid = inv.invPaymentStatusCode === "paid";
                    const isSelected = selectedRowId === inv.id;
                    const docNum = safeString(inv.invoiceNo || inv.number, `#${inv.id}`);
                    const vs = safeString(inv.variableSymbol, "—");
                    const partnerName = safeString(inv.supplier?.name || inv.customer?.name, "Nezadáno");
                    const partnerTin = safeString(inv.tin || inv.supplier?.vatId || inv.supplier?.taxId || inv.supplier?.idNumber || inv.customer?.vatId, "");
                    const total = safeNumber(inv.totalAmount, 0);
                    const outstanding = inv.outstandingAmount != null 
                      ? safeNumber(inv.outstandingAmount, 0)
                      : (isPaid ? 0 : total);
                    const dateToShow = inv.issueDate || inv.receivedDate || inv.transactionDate;

                    return (
                      <tr 
                        key={inv.id}
                        className={isSelected ? "row-selected" : ""}
                        onClick={() => setSelectedRowId(inv.id)}
                        onDoubleClick={() => {
                          setEditingInvoice(inv);
                          setIsFormOpen(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                          {docNum}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>
                          {vs}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{partnerName}</div>
                          {partnerTin && <div style={{ fontSize: "0.725rem", opacity: isSelected ? 0.9 : 0.7 }}>IČ/DIČ: {partnerTin}</div>}
                        </td>
                        <td>{safeDate(dateToShow)}</td>
                        <td style={{ fontWeight: !isPaid ? 600 : 400 }}>
                          {safeDate(inv.dueDate)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {safeCurrency(total)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {safeCurrency(outstanding)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${isPaid ? "badge-paid" : "badge-unpaid"}`}>
                            {isPaid ? "Uhrazeno" : "Neuhrazeno"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                            }}
                            className="asol-btn"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: isSelected ? "rgba(255,255,255,0.2)" : "#ffffff",
                              borderColor: isSelected ? "rgba(255,255,255,0.5)" : "#cbd5e1",
                              color: isSelected ? "#ffffff" : "#0284c7",
                            }}
                            title="Zobrazit detail dokladu"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary and Pagination Bar */}
          <div style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.825rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "#64748b" }}>Zobrazeno záznamů: </span>
                <strong style={{ color: "#1e293b" }}>{filteredInvoices.length}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Fakturovaná částka: </span>
                <strong style={{ color: "#0284c7" }}>{safeCurrency(totalAmount)}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Zbývá uhradit: </span>
                <strong style={{ color: totalOutstanding > 0 ? "#dc2626" : "#16a34a" }}>
                  {safeCurrency(totalOutstanding)}
                </strong>
              </div>
            </div>

            {filteredInvoices.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredInvoices.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </div>

        {/* View Detail Modal */}
        {selectedInvoice && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedInvoice(null);
            }}
          >
            <div 
              className="modal-dialog animate-fade-in" 
              style={{ maxWidth: "780px", padding: "1.75rem" }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div className="asol-breadcrumb" style={{ margin: 0, padding: 0, background: "transparent", border: "none" }}>
                    <span>Faktury</span>
                    <span className="separator">/</span>
                    <span className="current">{selectedInvoice.invoiceNo || selectedInvoice.id}</span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginTop: "0.25rem" }}>
                    Detail faktury {selectedInvoice.invoiceNo || selectedInvoice.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Detail Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* 2-column partner and payment info */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}>
                  <div>
                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      {activeType === "issued" ? "Odběratel / Partner" : "Dodavatel / Partner"}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                      {safeString(selectedInvoice.supplier?.name || selectedInvoice.customer?.name, "Nezadáno")}
                    </div>
                    {(selectedInvoice.tin || selectedInvoice.supplier?.vatId || selectedInvoice.supplier?.idNumber) && (
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>
                        IČ/DIČ: {safeString(selectedInvoice.tin || selectedInvoice.supplier?.vatId || selectedInvoice.supplier?.idNumber)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      Platební údaje
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "#1e293b" }}>
                      VS: <strong style={{ fontFamily: "var(--font-mono)" }}>{safeString(selectedInvoice.variableSymbol, "—")}</strong>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>
                      Způsob úhrady: {safeString(selectedInvoice.paymentType, "Převodem")}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  fontSize: "0.825rem",
                }}>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Datum vystavení</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>
                      {safeDate(selectedInvoice.issueDate || selectedInvoice.receivedDate || selectedInvoice.transactionDate)}
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Datum splatnosti</div>
                    <div style={{ fontWeight: 600, color: selectedInvoice.invPaymentStatusCode === "unpaid" ? "#dc2626" : "#1e293b", marginTop: "0.2rem" }}>
                      {safeDate(selectedInvoice.dueDate)}
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>DUZP</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>{safeDate(selectedInvoice.vatDate)}</div>
                  </div>
                </div>

                {/* Amounts & Payment Status Card */}
                <div style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "6px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Stav dokladu:</div>
                    <div style={{ marginTop: "0.25rem" }}>
                      {selectedInvoice.invPaymentStatusCode === "paid" ? (
                        <span className="badge badge-paid">
                          <CheckCircle2 size={13} />
                          <span>Faktura je kompletně uhrazena</span>
                        </span>
                      ) : (
                        <span className="badge badge-unpaid">
                          <Clock size={13} />
                          <span>Neuhrazeno • Zbývá: {safeCurrency(selectedInvoice.outstandingAmount != null ? selectedInvoice.outstandingAmount : selectedInvoice.totalAmount)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Celkem k úhradě:</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0284c7" }}>
                      {safeCurrency(selectedInvoice.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setEditingInvoice(selectedInvoice);
                      setSelectedInvoice(null);
                      setIsFormOpen(true);
                    }}
                    className="asol-btn"
                  >
                    <Edit3 size={14} />
                    <span>Upravit doklad</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="asol-btn"
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
          key={editingInvoice ? `${editingInvoice.id}-${editingInvoice.invoiceNo || editingInvoice.number || ''}` : `new-${activeType}`}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingInvoice(null);
          }}
          onSave={(saved) => {
            onSaveInvoice?.(saved);
            setIsFormOpen(false);
            setEditingInvoice(null);
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
