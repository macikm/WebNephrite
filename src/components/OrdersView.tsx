"use client";

import { useState } from "react";
import { Order } from "@/types/helios";
import { Search, ShoppingCart, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface OrdersViewProps {
  ordersReceived: Order[];
  ordersIssued: Order[];
  isLoading: boolean;
}

export function OrdersView({ ordersReceived, ordersIssued, isLoading }: OrdersViewProps) {
  const [subType, setSubType] = useState<"received" | "issued">("received");
  const [search, setSearch] = useState("");

  const currentList = subType === "received" ? ordersReceived : ordersIssued;

  const filtered = currentList.filter((o) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.number && o.number.toLowerCase().includes(term)) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(term)) ||
      (o.customerName && o.customerName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          {/* Subtype toggle */}
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
            <button
              onClick={() => setSubType("received")}
              className={`btn ${subType === "received" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <span>Přijaté objednávky ({ordersReceived.length})</span>
            </button>
            <button
              onClick={() => setSubType("issued")}
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

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Číslo objednávky</th>
                <th>Klient / Partner</th>
                <th>Datum vystavení</th>
                <th>Termín dodání</th>
                <th>Stav</th>
                <th>Částka</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Načítám objednávky ze systému Helios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Žádné objednávky neodpovídají hledání.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {order.orderNumber || order.number || `#${order.id}`}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {order.customer?.name || order.customerName || "Běžný zákazník"}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString("cs-CZ") : "—"}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("cs-CZ") : "—"}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        <Clock size={12} />
                        <span>Zpracovává se</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {order.totalAmount ? `${order.totalAmount.toLocaleString("cs-CZ")} Kč` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
