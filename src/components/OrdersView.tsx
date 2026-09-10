"use client";

import { useState } from "react";
import { Order } from "@/types/helios";
import { Search, ShoppingCart, Clock, CheckCircle2, Eye, X, Building, Calendar } from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { SortDirection, sortData, safeString, safeNumber, safeDate, safeCurrency } from "@/lib/table-utils";

interface OrdersViewProps {
  ordersReceived: Order[];
  ordersIssued: Order[];
  isLoading: boolean;
}

export function OrdersView({ ordersReceived, ordersIssued, isLoading }: OrdersViewProps) {
  const [subType, setSubType] = useState<"received" | "issued">("received");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("orderDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const currentList = subType === "received" ? ordersReceived : ordersIssued;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
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

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení objednávek">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            {/* Subtype toggle */}
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
              <button
                onClick={() => { setSubType("received"); setSortKey("orderDate"); }}
                className={`btn ${subType === "received" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              >
                <span>Přijaté objednávky ({ordersReceived.length})</span>
              </button>
              <button
                onClick={() => { setSubType("issued"); setSortKey("orderDate"); }}
                className={`btn ${subType === "issued" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              >
                <span>Vydané objednávky ({ordersIssued.length})</span>
              </button>
            </div>

            <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                placeholder="Hledat podle čísla objednávky nebo partnera..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table with horizontal scroll */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div className="table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "85px", textAlign: "center" }}>Detail</th>
                  <SortableHeader
                    label="Číslo objednávky"
                    columnKey="orderNumber"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Klient / Partner"
                    columnKey="customer.name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Datum vystavení"
                    columnKey="orderDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Termín dodání"
                    columnKey="deliveryDate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Stav"
                    columnKey="status"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Částka"
                    columnKey="totalAmount"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám objednávky ze systému Helios...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Žádné objednávky neodpovídají hledání.
                    </td>
                  </tr>
                ) : (
                  sorted.map((order) => {
                    const client = safeString(order.customer?.name || order.customerName, "Běžný zákazník");
                    const orderNo = safeString(order.orderNumber || order.number, `#${order.id}`);

                    return (
                      <tr key={order.id}>
                        {/* Detail in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                            title="Zobrazit detail objednávky"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {orderNo}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {client}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {safeDate(order.orderDate)}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {safeDate(order.deliveryDate)}
                        </td>
                        <td>
                          <span className="badge badge-info">
                            <Clock size={12} />
                            <span>{safeString(order.status, "V řešení")}</span>
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {order.totalAmount != null ? safeCurrency(order.totalAmount) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Robust Order Detail Modal */}
        {selectedOrder && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedOrder(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "560px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25))",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-blue)",
                  }}>
                    <ShoppingCart size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", fontWeight: 700 }}>
                      {subType === "received" ? "Přijatá objednávka" : "Vydaná objednávka"}
                    </div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                      {safeString(selectedOrder.orderNumber || selectedOrder.number, `#${selectedOrder.id}`)}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
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
                  title="Zavřít"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{
                  background: "rgba(10, 15, 25, 0.6)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Partner / Odběratel:</div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem" }}>
                      {safeString(selectedOrder.customer?.name || selectedOrder.customerName, "Běžný zákazník")}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Datum vystavení:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {safeDate(selectedOrder.orderDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Termín dodání:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {safeDate(selectedOrder.deliveryDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Stav zpracování:</div>
                      <div style={{ marginTop: "0.2rem" }}>
                        <span className="badge badge-info">
                          {safeString(selectedOrder.status, "V evidenci")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Celková částka:</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--brand-primary)", marginTop: "0.2rem" }}>
                        {selectedOrder.totalAmount != null ? safeCurrency(selectedOrder.totalAmount) : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.note && typeof selectedOrder.note === "string" && selectedOrder.note.trim() && (
                  <div style={{
                    padding: "0.85rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}>
                    Poznámka: {selectedOrder.note}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedOrder(null)}
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
    </ErrorBoundary>
  );
}
