"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Minimize2,
  Printer
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { ErrorBoundary } from "./ErrorBoundary";
import { DocumentFormModal } from "./forms/DocumentFormModal";
import { SortDirection, sortData, safeString, safeDate } from "@/lib/table-utils";
import { useEscapeKey } from "@/lib/useEscapeKey";

interface DocumentsViewProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onSaveDocument?: (doc: DocumentItem) => void;
}

export function DocumentsView({ documents, isLoading, onSaveDocument }: DocumentsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create clean Blob URL for native browser PDF and image viewer
  useEffect(() => {
    if (!selectedDoc?.fileContent) {
      setPreviewBlobUrl(null);
      return;
    }
    try {
      const rawContent = selectedDoc.fileContent.replace(/\s/g, "");
      const byteCharacters = atob(rawContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const fn = (selectedDoc.fileName || selectedDoc.name || "").toLowerCase();
      const mime = fn.endsWith(".pdf")
        ? "application/pdf"
        : fn.match(/\.(jpg|jpeg)$/)
        ? "image/jpeg"
        : fn.endsWith(".png")
        ? "image/png"
        : fn.endsWith(".webp")
        ? "image/webp"
        : fn.endsWith(".svg")
        ? "image/svg+xml"
        : fn.endsWith(".txt")
        ? "text/plain"
        : fn.endsWith(".md")
        ? "text/markdown"
        : "application/octet-stream";
      const blob = new Blob([byteArray], { type: mime });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Error creating preview blob URL:", err);
      setPreviewBlobUrl(null);
    }
  }, [selectedDoc?.fileContent, selectedDoc?.fileName, selectedDoc?.name]);

  useEscapeKey(() => {
    setSelectedDoc(null);
  }, Boolean(selectedDoc));

  const handlePrint = () => {
    const iframe = document.getElementById("dmsPreviewFrame") as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

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

        {/* Integrated DMS Document Viewer Modal – UBLviewer Inspired Fullscreen Overlay */}
        {selectedDoc && (() => {
          const fn = (selectedDoc.fileName || selectedDoc.name || "").toLowerCase();
          const isPdf = fn.endsWith(".pdf");
          const isImage = fn.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
          const isText = fn.match(/\.(txt|md|markdown|json|xml|csv|log)$/);

          const viewerModalContent = (
            <div 
              id="previewContainer" 
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                background: "#0f172a",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {/* TOP TOOLBAR (UBLviewer style) */}
              <div style={{
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                padding: "10px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                flexShrink: 0,
                gap: "1rem",
              }}>
                {/* Left side: Icon, Title, Format Badge, Metadata */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    background: isPdf ? "#fee2e2" : isImage ? "#f0fdf4" : "#e0f2fe",
                    border: `1px solid ${isPdf ? "#fca5a5" : isImage ? "#bbf7d0" : "#bae6fd"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isPdf ? "#dc2626" : isImage ? "#16a34a" : "#0284c7",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}>
                    {isPdf ? "📄" : isImage ? "🖼️" : "📁"}
                  </div>

                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {safeString(selectedDoc.name, "Náhled dokladu")}
                      </span>

                      {/* Format Badge */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: isPdf ? "#fee2e2" : isImage ? "#f0fdf4" : "#f1f5f9",
                        color: isPdf ? "#b91c1c" : isImage ? "#15803d" : "#475569",
                        border: `1px solid ${isPdf ? "#fecaca" : isImage ? "#bbf7d0" : "#cbd5e1"}`,
                        flexShrink: 0,
                      }}>
                        {isPdf ? "PDF" : isImage ? "Obrázek" : isText ? "Text" : "Dokument"}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "10px", alignItems: "center", whiteSpace: "nowrap" }}>
                      <span>Ref: <strong>{safeString(selectedDoc.reference || selectedDoc.documentNumber, `#${selectedDoc.id}`)}</strong></span>
                      <span>•</span>
                      <span>Soubor: <strong>{safeString(selectedDoc.fileName, "—")}</strong></span>
                      <span>•</span>
                      <span>Velikost: <strong>{formatFileSize(selectedDoc.fileContentLength)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right side Actions (UBLviewer style) */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      const d = selectedDoc;
                      setSelectedDoc(null);
                      setEditingDoc(d);
                      setIsFormOpen(true);
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
                    title="Upravit metadata dokumentu"
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    style={{
                      border: "1px solid #0284c7",
                      background: "#0284c7",
                      color: "#ffffff",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0369a1"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0284c7"}
                    title="Stáhnout originální soubor"
                  >
                    <Download size={14} />
                    <span>Stáhnout</span>
                  </button>

                  {isPdf && (
                    <button
                      onClick={handlePrint}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        padding: "7px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
                      title="Vytisknout dokument"
                    >
                      <Printer size={14} />
                      <span>Tisk</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsFullWidth(!isFullWidth)}
                    style={{
                      border: isFullWidth ? "1px solid #bae6fd" : "1px solid #cbd5e1",
                      background: isFullWidth ? "#e0f2fe" : "#ffffff",
                      color: isFullWidth ? "#0284c7" : "#334155",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                    }}
                    title={isFullWidth ? "Zúžit na standardní šířku (1100 px)" : "Rozšířit na celou šířku obrazovky"}
                  >
                    {isFullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    <span>{isFullWidth ? "Zúžit" : "Celá šířka"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedDoc(null)}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#475569",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    title="Zavřít prohlížeč (Esc)"
                  >
                    <X size={14} />
                    <span>Zavřít</span>
                    <kbd style={{
                      background: "#e2e8f0",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      marginLeft: "2px",
                      color: "#64748b",
                    }}>Esc</kbd>
                  </button>
                </div>
              </div>

              {/* MAIN PREVIEW CONTENT AREA (UBLviewer style: neutral slate background #334155, centered document sheet) */}
              <div style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "stretch",
                padding: "16px",
                background: "#334155",
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: isFullWidth ? "none" : "1100px",
                  height: "100%",
                  background: isPdf ? "#ffffff" : isImage ? "#0f172a" : "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.3)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "max-width 0.2s ease",
                }}>
                  {isLoadingContent ? (
                    <div style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "1rem",
                      color: "#f8fafc",
                    }}>
                      <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <div style={{ fontSize: "1rem", fontWeight: 600 }}>Stahuji obsah dokumentu ze serveru Helios...</div>
                    </div>
                  ) : previewBlobUrl && isPdf ? (
                    <iframe
                      id="dmsPreviewFrame"
                      src={`${previewBlobUrl}#view=FitH&toolbar=1&navpanes=0`}
                      style={{ width: "100%", height: "100%", border: "none", background: "#ffffff" }}
                      title={selectedDoc.name}
                    />
                  ) : previewBlobUrl && isImage ? (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "auto",
                      padding: "24px",
                      boxSizing: "border-box",
                    }}>
                      <img
                        src={previewBlobUrl}
                        alt={selectedDoc.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          borderRadius: "6px",
                          boxShadow: "0 20px 35px rgba(0, 0, 0, 0.6)",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  ) : (
                    /* Fallback Card from UBLviewer */
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px",
                      boxSizing: "border-box",
                      background: "#0f172a",
                    }}>
                      <div style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        maxWidth: "540px",
                        width: "100%",
                        padding: "36px 30px",
                        textAlign: "center",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                        <div style={{ fontSize: "52px", lineHeight: 1, marginBottom: "16px" }}>
                          {fn.match(/\.(dwg|dxf|cad)$/) ? "📐" : fn.match(/\.(xlsx?|ods|csv)$/) ? "📊" : fn.match(/\.(docx?|odt|rtf)$/) ? "📝" : fn.match(/\.(zip|rar|7z|tar)$/) ? "📦" : "📎"}
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>
                          Náhled není k dispozici přímo v prohlížeči
                        </h2>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#0284c7",
                          background: "#e0f2fe",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          marginBottom: "12px",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {safeString(selectedDoc.fileName, selectedDoc.name)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                          Velikost: {formatFileSize(selectedDoc.fileContentLength)} • Vytvořeno: {safeDate(selectedDoc.createdOn)}
                        </div>
                        <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.55, margin: "0 0 24px 0" }}>
                          Tento typ souboru nelze přímo zobrazit v okně webového prohlížeče. Můžete si jej stáhnout a otevřít ve své výchozí systémové aplikaci.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDownload(selectedDoc)}
                          style={{
                            background: "#0284c7",
                            color: "#ffffff",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Download size={16} />
                          <span>Stáhnout a otevřít v aplikaci</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
          return mounted ? createPortal(viewerModalContent, document.body) : viewerModalContent;
        })()}

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
