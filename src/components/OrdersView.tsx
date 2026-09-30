"use client";

import { useState } from "react";
import { Order, Customer, Product } from "@/types/helios";
import { 
  Search, 
  ShoppingCart, 
  Eye, 
  Calendar, 
  Building, 
  X, 
  Plus, 
  Edit3,
  ChevronDown,
  Download
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { OrderFormModal } from "./forms/OrderFormModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { SortDirection, sortData, safeString, safeNumber, safeDate, safeCurrency } from "@/lib/table-utils";

interface OrdersViewProps {
  ordersReceived: Order[];
  ordersIssued: Order[];
  isLoading: boolean;
  customers?: Customer[];
  products?: Product[];
  onSaveOrder?: (order: Order) => void;
}

export function OrdersView({
  ordersReceived,
  ordersIssued,
  isLoading,
  customers = [],
  products = [],
  onSaveOrder,
}: OrdersViewProps) {
  const [subType, setSubType] = useState<"received" | "issued">("received");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("orderDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const currentList = subType === "received" ? ordersReceived : ordersIssued;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filtered = currentList.filter((o) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const num = safeString(o.orderNumber || o.number, "").toLowerCase();
    const cust = safeString(o.customer?.name || o.customerName, "").toLowerCase();
    return num.includes(term) || cust.includes(term);
  });

  const sorted = sortData(filtered, sortKey, sortDirection);

  const paginatedOrders = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeSelected = currentList.find(o => o.id === selectedRowId) || null;

  const handleEditSelected = () => {
    if (activeSelected) {
      setEditingOrder(activeSelected);
      setIsFormOpen(true);
    }
  };

  const handleExportCsv = () => {
    const headers = "Cislo;Partner;Datum;Termin;Castka;Stav\n";
    const rows = filtered.map(o => 
      `"${o.orderNumber || o.number || o.id}";"${o.customer?.name || o.customerName || ''}";"${safeDate(o.orderDate)}";"${safeDate(o.deliveryDate)}";"${o.totalAmount || 0}";"${o.status || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `objednavky_${subType}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowActionsMenu(false);
  };

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení objednávek">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* ASOL Breadcrumbs matching Screenshot 2 */}
        <div className="asol-breadcrumb">
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Obchod</span>
          <span className="separator">/</span>
          <span className="current">{subType === "received" ? "Objednávky přijaté" : "Objednávky vydané"}</span>
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
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsFormOpen(true);
              }}
              title={subType === "received" ? "Nová přijatá objednávka (+)" : "Nová vydaná objednávka (+)"}
              className="asol-btn asol-btn-icon"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={handleEditSelected}
              disabled={!activeSelected}
              title={activeSelected ? `Upravit vybranou objednávku` : "Vyberte objednávku v tabulce pro úpravu"}
              className="asol-btn asol-btn-icon"
            >
              <Edit3 size={16} />
            </button>

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
                </div>
              )}
            </div>

            <div style={{ width: "1px", height: "24px", background: "#cbd5e1", margin: "0 0.25rem" }} />

            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                onClick={() => { setSubType("received"); setSortKey("orderDate"); setCurrentPage(1); }}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: subType === "received" ? 700 : 500,
                  borderRadius: "5px",
                  background: subType === "received" ? "#e0f2fe" : "transparent",
                  color: subType === "received" ? "#0284c7" : "#64748b",
                  border: subType === "received" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Přijaté ({ordersReceived.length})
              </button>
              <button
                onClick={() => { setSubType("issued"); setSortKey("orderDate"); setCurrentPage(1); }}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: subType === "issued" ? 700 : 500,
                  borderRadius: "5px",
                  background: subType === "issued" ? "#e0f2fe" : "transparent",
                  color: subType === "issued" ? "#0284c7" : "#64748b",
                  border: subType === "issued" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Vydané ({ordersIssued.length})
              </button>
            </div>
          </div>

          {/* Search input */}
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: "2rem", paddingRight: "1.75rem", fontSize: "0.825rem", height: "34px" }}
              placeholder="Hledat objednávku nebo partnera..."
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
                    label="Číslo objednávky"
                    columnKey="orderNumber"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "160px" }}
                  />
                  <SortableHeader
                    label="Klient / Partner"
                    columnKey="customer.name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Datum objednání"
                    columnKey="orderDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "130px" }}
                  />
                  <SortableHeader
                    label="Termín dodání"
                    columnKey="deliveryDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "130px" }}
                  />
                  <SortableHeader
                    label="Celková hodnota"
                    columnKey="totalAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "140px", textAlign: "right" }}
                  />
                  <SortableHeader
                    label="Stav"
                    columnKey="status"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    style={{ width: "120px", textAlign: "center" }}
                  />
                  <th style={{ width: "90px", textAlign: "center" }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      Načítám objednávky z Helios Nephrite...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      Nebyly nalezeny žádné objednávky.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => {
                    const isSelected = selectedRowId === ord.id;
                    const docNum = safeString(ord.orderNumber || ord.number, `#${ord.id}`);
                    const partner = safeString(ord.customer?.name || ord.customerName, "Nezadáno");
                    const total = safeNumber(ord.totalAmount, 0);

                    return (
                      <tr 
                        key={ord.id}
                        className={isSelected ? "row-selected" : ""}
                        onClick={() => setSelectedRowId(ord.id)}
                        onDoubleClick={() => {
                          setEditingOrder(ord);
                          setIsFormOpen(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                          {docNum}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{partner}</div>
                        </td>
                        <td>{safeDate(ord.orderDate)}</td>
                        <td>{safeDate(ord.deliveryDate)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {safeCurrency(total)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-info">
                            {safeString(ord.status, "V řešení")}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="asol-btn"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: isSelected ? "rgba(255,255,255,0.2)" : "#ffffff",
                              borderColor: isSelected ? "rgba(255,255,255,0.5)" : "#cbd5e1",
                              color: isSelected ? "#ffffff" : "#0284c7",
                            }}
                            title="Zobrazit detail"
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

          {/* Footer Bar */}
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
            <div>
              <span style={{ color: "#64748b" }}>Zobrazeno záznamů: </span>
              <strong style={{ color: "#1e293b" }}>{filtered.length}</strong>
            </div>

            {filtered.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </div>

        {/* View Detail Modal */}
        {selectedOrder && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedOrder(null);
            }}
          >
            <div 
              className="modal-dialog animate-fade-in" 
              style={{ maxWidth: "700px", padding: "1.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div className="asol-breadcrumb" style={{ margin: 0, padding: 0, background: "transparent", border: "none" }}>
                    <span>Objednávky</span>
                    <span className="separator">/</span>
                    <span className="current">{selectedOrder.orderNumber || selectedOrder.id}</span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginTop: "0.25rem" }}>
                    Objednávka {selectedOrder.orderNumber || selectedOrder.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
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

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Partner
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", marginTop: "0.2rem" }}>
                    {safeString(selectedOrder.customer?.name || selectedOrder.customerName, "Nezadáno")}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.825rem" }}>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Datum objednání</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>{safeDate(selectedOrder.orderDate)}</div>
                  </div>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Termín dodání</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>{safeDate(selectedOrder.deliveryDate)}</div>
                  </div>
                </div>

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
                    <span className="badge badge-info">{safeString(selectedOrder.status, "V řešení")}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Celková hodnota:</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0284c7" }}>
                      {safeCurrency(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setEditingOrder(selectedOrder);
                      setSelectedOrder(null);
                      setIsFormOpen(true);
                    }}
                    className="asol-btn"
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="asol-btn"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Form Modal */}
        <OrderFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={(saved) => {
            onSaveOrder?.(saved);
            setIsFormOpen(false);
          }}
          initialOrder={editingOrder}
          defaultSubType={subType}
          customers={customers}
          products={products}
        />
      </div>
    </ErrorBoundary>
  );
}
