"use client";

import { useState } from "react";
import { DocumentItem } from "@/types/helios";
import { FolderArchive, FileText, Download, Search, Eye, X } from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { SortDirection, sortData, safeString, safeDate } from "@/lib/table-utils";

interface DocumentsViewProps {
  documents: DocumentItem[];
  isLoading: boolean;
}

export function DocumentsView({ documents, isLoading }: DocumentsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("createdOn");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filtered = documents.filter((d) => {
    const term = search.toLowerCase().trim();
    return !term || safeString(d.name, "").toLowerCase().includes(term) || safeString(d.documentNumber, "").toLowerCase().includes(term);
  });

  const sorted = sortData(filtered, sortKey, sortDirection);

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení dokumentů">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Správa dokumentů DMS</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Elektronický archiv smluv, příloh a externích dokumentů
              </p>
            </div>

            <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                placeholder="Hledat dokument..."
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
                    label="Číslo dokumentu"
                    columnKey="documentNumber"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Název dokumentu"
                    columnKey="name"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Vytvořeno"
                    columnKey="createdOn"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th>Typ / Soubor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám dokumenty DMS...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      V archivu nejsou žádné dokumenty odpovídající filtru.
                    </td>
                  </tr>
                ) : (
                  sorted.map((d) => (
                    <tr key={d.id}>
                      {/* Detail in 1st column */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedDoc(d)}
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                          title="Zobrazit detail dokumentu"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {safeString(d.documentNumber, `#${d.id}`)}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FileText size={16} style={{ color: "var(--brand-primary)" }} />
                          <span style={{ fontWeight: 600 }}>{safeString(d.name)}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {safeDate(d.createdOn)}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {d.fileName ? safeString(d.fileName.split(".").pop()?.toUpperCase(), "PDF") : "PDF"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Robust Document Detail Modal */}
        {selectedDoc && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDoc(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "560px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(16, 185, 129, 0.25))",
                    border: "1px solid rgba(6, 182, 212, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-cyan)",
                  }}>
                    <FolderArchive size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                      {safeString(selectedDoc.name, "Detail dokumentu")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Číslo: {safeString(selectedDoc.documentNumber, `#${selectedDoc.id}`)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
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
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.85rem",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Vytvořeno dne:</div>
                    <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                      {safeDate(selectedDoc.createdOn)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>ID záznamu:</div>
                    <div style={{ fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                      #{selectedDoc.id}
                    </div>
                  </div>

                  {selectedDoc.fileName && (
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Název souboru:</div>
                      <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: "0.2rem", color: "var(--accent-cyan)" }}>
                        {safeString(selectedDoc.fileName)}
                      </div>
                    </div>
                  )}
                </div>

                {selectedDoc.description && typeof selectedDoc.description === "string" && selectedDoc.description.trim() && (
                  <div style={{
                    padding: "0.85rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}>
                    {selectedDoc.description}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedDoc(null)}
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
