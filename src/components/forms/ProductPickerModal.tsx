"use client";

import { useState, useMemo } from "react";
import { Search, X, Package, Check, ArrowUpDown } from "lucide-react";
import { Product } from "@/types/helios";
import { safeCurrency, safeString, safeNumber, SortDirection, sortData } from "@/lib/table-utils";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
}

export function ProductPickerModal({
  isOpen,
  onClose,
  onSelectProduct,
  products,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) => {
      const name = safeString(p.name, "").toLowerCase();
      const code = safeString(p.referenceId || String(p.id), "").toLowerCase();
      const barcode = safeString(p.barcode, "").toLowerCase();
      const desc = safeString(p.description, "").toLowerCase();
      return name.includes(term) || code.includes(term) || barcode.includes(term) || desc.includes(term);
    });
  }, [products, search]);

  const sortedProducts = useMemo(() => {
    return sortData(filteredProducts, sortKey, sortDirection);
  }, [filteredProducts, sortKey, sortDirection]);

  if (!isOpen) return null;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 1100 }}
    >
      <div
        className="modal-dialog animate-fade-in"
        style={{ maxWidth: "860px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "1.75rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--brand-primary), #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                Výběr ze skladu a ceníku
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Vyberte položku ze seznamu pro vložení do dokladu ({products.length} produktů celkem)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "1rem", position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
            }}
          />
          <input
            type="text"
            autoFocus
            className="input-control"
            style={{ paddingLeft: "2.35rem", paddingRight: "2.35rem", fontSize: "0.9rem" }}
            placeholder="Rychlé vyhledávání podle názvu, kódu položky nebo EAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Results summary */}
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between" }}>
          <span>Nalezeno: <strong style={{ color: "var(--text-main)" }}>{sortedProducts.length}</strong> položek</span>
          <span>Dvojklikem nebo tlačítkem vložíte položku do dokladu</span>
        </div>

        {/* Table of products */}
        <div className="table-wrapper" style={{ flex: 1, maxHeight: "420px", overflowY: "auto", border: "1px solid var(--border-card)", borderRadius: "var(--radius-md)" }}>
          <table className="erp-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("referenceId")}
                  style={{ width: "18%", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>Kód</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ width: "42%", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>Název zboží / služby</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                  </div>
                </th>
                <th style={{ width: "10%", textAlign: "center" }}>Jednotka</th>
                <th
                  onClick={() => handleSort("price")}
                  style={{ width: "15%", textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", justifyContent: "flex-end" }}>
                    <span>Cena bez DPH</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                  </div>
                </th>
                <th style={{ width: "8%", textAlign: "center" }}>DPH</th>
                <th style={{ width: "70px", textAlign: "center" }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-dim)" }}>
                    {search ? `Žádné položky neodpovídají výrazu "${search}".` : "V ceníku nejsou k dispozici žádné položky."}
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p) => {
                  const price = safeNumber(p.price || p.unitPrice, 0);
                  const code = safeString(p.referenceId || `#${p.id}`);
                  const vatRate = p.vatRate != null ? `${p.vatRate} %` : "21 %";

                  return (
                    <tr
                      key={p.id}
                      onDoubleClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                        {code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "340px" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {p.measureUnit || "ks"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}>
                        {safeCurrency(price)}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {vatRate}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.25rem" }}
                          title="Vložit tuto položku"
                        >
                          <Check size={12} />
                          <span>Vybrat</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "0.45rem 1.25rem" }}
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
