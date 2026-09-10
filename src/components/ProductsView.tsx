"use client";

import { useState } from "react";
import { Product } from "@/types/helios";
import { 
  Search, 
  Barcode, 
  X, 
  CheckCircle2, 
  Eye,
  Package
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { ErrorBoundary } from "./ErrorBoundary";
import { 
  SortDirection, 
  sortData, 
  safeString, 
  safeNumber 
} from "@/lib/table-utils";

interface ProductsViewProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductsView({ products, isLoading }: ProductsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      safeString(p.name, "").toLowerCase().includes(term) ||
      safeString(p.referenceId, "").toLowerCase().includes(term) ||
      safeString(p.barcode, "").toLowerCase().includes(term)
    );
  });

  const sortedProducts = sortData(filteredProducts, sortKey, sortDirection);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení produktů">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Header filter & search */}
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Katalog zboží a služeb</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Ceníky, měrné jednotky a sazby DPH z Helios Nephrite
              </p>
            </div>

            <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                placeholder="Hledat zboží podle názvu, kódu nebo EAN..."
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
          </div>

          <div style={{
            marginTop: "1rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}>
            <div>Položek celkem: <strong style={{ color: "var(--text-main)" }}>{products.length}</strong></div>
            <div>Filtrováno: <strong style={{ color: "var(--brand-primary)" }}>{filteredProducts.length}</strong></div>
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
                    label="Kód / Ref ID"
                    columnKey="referenceId"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Název položky"
                    columnKey="name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Typ"
                    columnKey="typeCode"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Jednotka"
                    columnKey="measureUnit"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Sazba DPH"
                    columnKey="vatRate"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Stav"
                    columnKey="statusCode"
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
                      Načítám produkty z Heliosu...
                    </td>
                  </tr>
                ) : sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Žádné produkty neodpovídají zadanému filtru.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => (
                    <tr key={prod.id}>
                      {/* Detail in 1st column */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedProduct(prod)}
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                          title="Zobrazit detail položky"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {safeString(prod.referenceId, `#${prod.id}`)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{safeString(prod.name)}</div>
                        {prod.barcode && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Barcode size={12} />
                            <span>{safeString(prod.barcode)}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>
                        {safeString(prod.typeCode, "Produkt")}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)" }}>
                          {safeString(prod.measureUnit, "ks")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {prod.vatRate != null ? `${safeNumber(prod.vatRate)} %` : "21 %"}
                      </td>
                      <td>
                        <span className="badge badge-paid">
                          <CheckCircle2 size={12} />
                          <span>{safeString(prod.statusCode, "Aktivní")}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Robust Product Detail Modal */}
        {selectedProduct && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedProduct(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "580px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-primary)",
                  }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                      {safeString(selectedProduct.name, "Katalogová karta položky")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Kód: {safeString(selectedProduct.referenceId, `#${selectedProduct.id}`)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
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
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "rgba(10, 15, 25, 0.6)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Referenční kód:</div>
                    <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "1rem", marginTop: "0.2rem" }}>
                      {safeString(selectedProduct.referenceId, "—")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>ID v Heliosu:</div>
                    <div style={{ fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                      #{selectedProduct.id}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Měrná jednotka:</div>
                    <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                      {safeString(selectedProduct.measureUnit, "ks")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Sazba DPH:</div>
                    <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                      {selectedProduct.vatRate != null ? `${safeNumber(selectedProduct.vatRate)} %` : "21 %"}
                    </div>
                  </div>

                  {selectedProduct.barcode && (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Čárový kód (EAN):</div>
                      <div style={{ fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                        {safeString(selectedProduct.barcode)}
                      </div>
                    </div>
                  )}

                  {selectedProduct.vendorName && (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Dodavatel:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {safeString(selectedProduct.vendorName)}
                      </div>
                    </div>
                  )}
                </div>

                {selectedProduct.description && typeof selectedProduct.description === "string" && selectedProduct.description.trim() && (
                  <div style={{
                    padding: "0.85rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}>
                    {selectedProduct.description}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedProduct(null)}
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
