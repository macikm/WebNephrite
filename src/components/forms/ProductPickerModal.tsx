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
        style={{ maxWidth: "880px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "1.5rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
                border: "1px solid #bae6fd",
              }}
            >
              <Package size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Výběr ze skladu a ceníku
              </h3>
              <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                Katalog položek ({products.length} položek)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "0.75rem", position: "relative" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            autoFocus
            className="input-control"
            style={{ paddingLeft: "2.1rem", paddingRight: "2rem", fontSize: "0.85rem", height: "36px" }}
            placeholder="Hledat podle názvu, kódu nebo popisu..."
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
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results summary */}
        <div style={{ fontSize: "0.775rem", color: "#64748b", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
          <span>Nalezeno: <strong style={{ color: "#1e293b" }}>{sortedProducts.length}</strong> položek</span>
          <span>Dvojklikem nebo tlačítkem vložíte do dokladu</span>
        </div>

        {/* Table of products */}
        <div className="table-wrapper" style={{ flex: 1, maxHeight: "400px", overflowY: "auto" }}>
          <table className="erp-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("referenceId")}
                  style={{ width: "18%", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>Kód</span>
                    <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ width: "45%", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>Název zboží / služby</span>
                    <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                  </div>
                </th>
                <th style={{ width: "10%", textAlign: "center" }}>Jednotka</th>
                <th
                  onClick={() => handleSort("price")}
                  style={{ width: "15%", textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", justifyContent: "flex-end" }}>
                    <span>Cena bez DPH</span>
                    <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                  </div>
                </th>
                <th style={{ width: "8%", textAlign: "center" }}>DPH</th>
                <th style={{ width: "70px", textAlign: "center" }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748b" }}>
                    {search ? `Žádné položky neodpovídají výrazu "${search}".` : "V ceníku nejsou k dispozici žádné položky."}
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p) => {
                  const price = safeNumber(p.price || p.unitPrice, 0);
                  const code = safeString(p.referenceId || `#${p.id}`);
                  const resolvedRate = p.vatRate != null ? (p.vatRate === 10 || p.vatRate === 15 ? 21 : p.vatRate) : 21;
                  const vatRate = `${resolvedRate} %`;
                  const productToSelect = { ...p, vatRate: resolvedRate };

                  return (
                    <tr
                      key={p.id}
                      onDoubleClick={() => {
                        onSelectProduct(productToSelect);
                        onClose();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#0284c7", fontWeight: 600 }}>
                        {code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "340px" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                        {p.measureUnit || "ks"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#0284c7" }}>
                        {safeCurrency(price)}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                        {vatRate}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(productToSelect);
                            onClose();
                          }}
                          className="asol-btn"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", background: "#f0f9ff", color: "#0284c7", borderColor: "#bae6fd" }}
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
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
          <button
            type="button"
            onClick={onClose}
            className="asol-btn"
            style={{ padding: "0.4rem 1.25rem" }}
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
