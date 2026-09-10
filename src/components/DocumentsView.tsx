"use client";

import { useState } from "react";
import { DocumentItem } from "@/types/helios";
import { FolderArchive, FileText, Download, Search, Upload } from "lucide-react";

interface DocumentsViewProps {
  documents: DocumentItem[];
  isLoading: boolean;
}

export function DocumentsView({ documents, isLoading }: DocumentsViewProps) {
  const [search, setSearch] = useState("");

  const filtered = documents.filter((d) => {
    const term = search.toLowerCase().trim();
    return !term || (d.name && d.name.toLowerCase().includes(term)) || (d.documentNumber && d.documentNumber.toLowerCase().includes(term));
  });

  return (
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

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Číslo dokumentu</th>
                <th>Název dokumentu</th>
                <th>Vytvořeno</th>
                <th>Typ / Soubor</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Načítám dokumenty DMS...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    V archivu nejsou žádné dokumenty odpovídající filtru.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{d.documentNumber || `#${d.id}`}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileText size={16} style={{ color: "var(--brand-primary)" }} />
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {d.createdOn ? new Date(d.createdOn).toLocaleDateString("cs-CZ") : "—"}
                    </td>
                    <td>
                      <span className="badge badge-info">{d.fileName ? d.fileName.split(".").pop()?.toUpperCase() : "PDF"}</span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
                        <Download size={13} />
                        <span>Stáhnout</span>
                      </button>
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
