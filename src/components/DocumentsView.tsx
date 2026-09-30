"use client";

import { useState } from "react";
import { DocumentItem } from "@/types/helios";
import { 
  FolderArchive, 
  FileText, 
  Download, 
  Search, 
  Eye, 
  X, 
  File, 
  Calendar, 
  HardDrive,
  Plus,
  Edit3,
  Maximize2,
  Minimize2
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { ErrorBoundary } from "./ErrorBoundary";
import { DocumentFormModal } from "./forms/DocumentFormModal";
import { SortDirection, sortData, safeString, safeDate } from "@/lib/table-utils";

interface DocumentsViewProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onSaveDocument?: (doc: DocumentItem) => void;
}

export function DocumentsView({ documents, isLoading, onSaveDocument }: DocumentsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isViewerMaximized, setIsViewerMaximized] = useState(false);

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<string | null>("createdOn");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
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

  const filtered = documents.filter((d) => {
    const term = search.toLowerCase().trim();
    return (
      !term ||
      safeString(d.name, "").toLowerCase().includes(term) ||
      safeString(d.fileName, "").toLowerCase().includes(term) ||
      safeString(d.documentNumber || d.reference, "").toLowerCase().includes(term)
    );
  });

  const sorted = sortData(filtered, sortKey, sortDirection);

  // Paginated slice
  const paginatedDocs = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openDocument = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    if (!doc.fileContent && doc.fileContentLength && doc.fileContentLength > 0) {
      setIsLoadingContent(true);
      try {
        const res = await fetch(`/api/helios/v1/Documents/DMSDocuments/${doc.id}`);
        if (res.ok) {
          const detail = await res.json();
          if (detail.fileContent) {
            setSelectedDoc(prev => (prev && prev.id === doc.id ? { ...prev, fileContent: detail.fileContent } : prev));
          }
        }
      } catch (err) {
        console.error("Failed to load document content:", err);
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    let content = doc.fileContent;
    if (!content && doc.fileContentLength && doc.fileContentLength > 0) {
      try {
        const res = await fetch(`/api/helios/v1/Documents/DMSDocuments/${doc.id}`);
        if (res.ok) {
          const detail = await res.json();
          content = detail.fileContent;
        }
      } catch (err) {
        console.error("Download fetch error:", err);
      }
    }
    if (!content) return;
    try {
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const mime = doc.fileName?.toLowerCase().endsWith(".pdf") 
        ? "application/pdf" 
        : doc.fileName?.toLowerCase().match(/\.(jpg|jpeg)$/) 
          ? "image/jpeg" 
          : "application/octet-stream";
      const blob = new Blob([byteArray], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || doc.name || `dokument_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení dokumentů">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* ASOL Breadcrumbs */}
        <div className="asol-breadcrumb">
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Správa</span>
          <span className="separator">/</span>
          <span className="current">Správa dokumentů DMS</span>
        </div>

        <div className="glass-panel" style={{ padding: "0.85rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>Správa dokumentů DMS</h3>
              <p style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                Elektronický archiv smluv, příloh a externích dokumentů s integrovaným prohlížečem
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: "1 1 400px", justifyContent: "flex-end" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "400px" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: "2rem", paddingRight: "1.75rem", fontSize: "0.825rem", height: "34px" }}
                  placeholder="Hledat dokument podle názvu nebo souboru..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setEditingDoc(null);
                  setIsFormOpen(true);
                }}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", gap: "0.4rem", whiteSpace: "nowrap" }}
              >
                <Plus size={16} />
                <span>Nahrát dokument</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table with horizontal scroll */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div className="table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "140px", textAlign: "center" }}>Akce</th>
                  <SortableHeader
                    label="Číslo / Ref"
                    columnKey="reference"
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
                    label="Soubor"
                    columnKey="fileName"
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Velikost"
                    columnKey="fileContentLength"
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
                  <th>Soubor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám dokumenty DMS...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      V archivu nejsou žádné dokumenty odpovídající filtru.
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((d) => {
                    const ext = d.fileName ? d.fileName.split(".").pop()?.toUpperCase() : "PDF";
                    const hasContent = Boolean(d.fileContent || (d.fileContentLength && d.fileContentLength > 0));

                    return (
                      <tr key={d.id}>
                        {/* Detail / View and Edit in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                            <button
                              onClick={() => openDocument(d)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Otevřít v integrovaném prohlížeči dokumentů"
                            >
                              <Eye size={13} />
                              <span>Zobrazit</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingDoc(d);
                                setIsFormOpen(true);
                              }}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Upravit dokument"
                            >
                              <Edit3 size={13} />
                              <span>Upravit</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {safeString(d.reference || d.documentNumber, `#${d.id}`)}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FileText size={16} style={{ color: "var(--brand-primary)" }} />
                            <span style={{ fontWeight: 600 }}>{safeString(d.name)}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.825rem" }}>
                          {safeString(d.fileName, "—")}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {formatFileSize(d.fileContentLength)}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {safeDate(d.createdOn)}
                        </td>
                        <td>
                          {hasContent && (
                            <button
                              onClick={() => handleDownload(d)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                              title="Stáhnout soubor"
                            >
                              <Download size={13} />
                              <span>Stáhnout</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={sorted.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Integrated DMS Document Viewer Modal */}
        {selectedDoc && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDoc(null);
            }}
          >
            <div 
              className="modal-dialog animate-fade-in" 
              style={{ 
                maxWidth: isViewerMaximized ? "97vw" : "860px", 
                width: isViewerMaximized ? "97vw" : "100%",
                height: isViewerMaximized ? "94vh" : "auto",
                maxHeight: isViewerMaximized ? "94vh" : "90vh",
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                transition: "all 0.2s ease-in-out"
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "6px",
                    background: "#e0f2fe",
                    border: "1px solid #bae6fd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0284c7",
                  }}>
                    <FolderArchive size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                      {safeString(selectedDoc.name, "Prohlížeč dokumentu")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "flex", gap: "0.75rem" }}>
                      <span>Ref: {safeString(selectedDoc.reference || selectedDoc.documentNumber, `#${selectedDoc.id}`)}</span>
                      <span>•</span>
                      <span>Velikost: {formatFileSize(selectedDoc.fileContentLength)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      const d = selectedDoc;
                      setSelectedDoc(null);
                      setEditingDoc(d);
                      setIsFormOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", gap: "0.35rem" }}
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  {selectedDoc.fileContent && (
                    <button
                      onClick={() => handleDownload(selectedDoc)}
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      <Download size={14} />
                      <span>Stáhnout</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsViewerMaximized(!isViewerMaximized)}
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      background: isViewerMaximized ? "#e0f2fe" : "#ffffff",
                      border: isViewerMaximized ? "1px solid #bae6fd" : "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isViewerMaximized ? "#0284c7" : "#64748b",
                      cursor: "pointer",
                    }}
                    title={isViewerMaximized ? "Zmenšit okno" : "Maximalizovat prohlížeč"}
                  >
                    {isViewerMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoc(null);
                      setIsViewerMaximized(false);
                    }}
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
                    title="Zavřít prohlížeč"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Integrated Viewer Body */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, minHeight: 0 }}>
                {isLoadingContent ? (
                  <div style={{
                    padding: "4rem 1.5rem",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                  }}>
                    <div className="spinner" style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Stahuji obsah dokumentu ze serveru Helios...
                    </div>
                  </div>
                ) : selectedDoc.fileContent ? (
                  selectedDoc.fileName?.toLowerCase().endsWith(".pdf") ? (
                    <div style={{
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--border-subtle)",
                      background: "#1e293b",
                      flex: 1,
                      minHeight: isViewerMaximized ? "calc(94vh - 140px)" : "600px",
                      height: isViewerMaximized ? "calc(94vh - 140px)" : "600px",
                    }}>
                      <iframe
                        src={`data:application/pdf;base64,${selectedDoc.fileContent}`}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title={selectedDoc.name}
                      />
                    </div>
                  ) : selectedDoc.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#080c14",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      flex: 1,
                      overflow: "auto",
                      maxHeight: isViewerMaximized ? "calc(94vh - 140px)" : "600px",
                    }}>
                      <img
                        src={`data:image/jpeg;base64,${selectedDoc.fileContent}`}
                        alt={selectedDoc.name}
                        style={{ maxWidth: "100%", maxHeight: isViewerMaximized ? "calc(94vh - 160px)" : "560px", objectFit: "contain", borderRadius: "4px" }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      padding: "3rem 1.5rem",
                      textAlign: "center",
                      background: "rgba(10, 15, 25, 0.6)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                    }}>
                      <File size={48} style={{ color: "var(--brand-primary)", marginBottom: "1rem" }} />
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{safeString(selectedDoc.fileName)}</div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                        Tento formát nelze zobrazit v inline náhledu. Pro prohlížení si soubor stáhněte do počítače.
                      </p>
                      <button
                        onClick={() => handleDownload(selectedDoc)}
                        className="btn btn-primary"
                        style={{ marginTop: "1.25rem" }}
                      >
                        <Download size={15} />
                        <span>Stáhnout soubor ({formatFileSize(selectedDoc.fileContentLength)})</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    background: "rgba(10, 15, 25, 0.6)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <File size={44} style={{ color: "var(--text-dim)", marginBottom: "1rem" }} />
                    <div style={{ fontWeight: 600 }}>Obsah souboru není v databázi přímo uložen</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                      Dokument je evidován v DMS jako externí odkaz či metadata záznamu.
                    </div>
                  </div>
                )}

                {/* Metadata summary */}
                <div style={{
                  background: "rgba(10, 15, 25, 0.6)",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}>
                  <div>Soubor: <strong style={{ color: "var(--text-main)" }}>{safeString(selectedDoc.fileName, "—")}</strong></div>
                  <div>Datum: <strong style={{ color: "var(--text-main)" }}>{safeDate(selectedDoc.createdOn)}</strong></div>
                  <div>DMS ID: <strong style={{ color: "var(--text-main)" }}>#{selectedDoc.id}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal for Create / Edit */}
        {isFormOpen && (
          <DocumentFormModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingDoc(null);
            }}
            initialData={editingDoc}
            onSave={(saved) => {
              if (onSaveDocument) onSaveDocument(saved);
              setIsFormOpen(false);
              setEditingDoc(null);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
