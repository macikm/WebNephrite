"use client";

import { useState } from "react";
import { Product } from "@/types/helios";
import { 
  Search, 
  Package, 
  Barcode, 
  Tag, 
  X, 
  CheckCircle2, 
  Percent,
  Layers
} from "lucide-react";

interface ProductsViewProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductsView({ products, isLoading }: ProductsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.referenceId && p.referenceId.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  });

  return (
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

      {/* Table */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Kód / Ref ID</th>
                <th>Název položky</th>
                <th>Typ</th>
                <th>Jednotka</th>
                <th>Sazba DPH</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Načítám produkty z Heliosu...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Žádné produkty neodpovídají zadanému filtru.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {prod.referenceId || `#${prod.id}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{prod.name}</div>
                      {prod.barcode && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Barcode size={12} />
                          <span>{prod.barcode}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>
                      {prod.typeCode || "Produkt"}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)" }}>
                        {prod.measureUnit || "ks"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {prod.vatRate != null ? `${prod.vatRate} %` : "21 %"}
                    </td>
                    <td>
                      <span className="badge badge-paid">
                        <CheckCircle2 size={12} />
                        <span>Aktivní</span>
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
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
            maxWidth: "580px",
            padding: "2rem",
            background: "rgba(18, 26, 42, 0.98)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", fontWeight: 700 }}>
                  Katalogová karta položky
                </div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: "0.2rem" }}>
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
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
                    {selectedProduct.referenceId || "—"}
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
                    {selectedProduct.measureUnit || "ks"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>DPH:</div>
                  <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                    {selectedProduct.vatRate != null ? `${selectedProduct.vatRate} %` : "21 %"}
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
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
  );
}
