"use client";

import { useState, useRef } from "react";
import { X, FolderArchive, Save, AlertCircle, UploadCloud, File, FileText, CheckCircle2 } from "lucide-react";
import { DocumentItem } from "@/types/helios";
import { useEscapeKey } from "@/lib/useEscapeKey";

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: DocumentItem) => void;
  initialDocument?: DocumentItem | null;
  initialData?: DocumentItem | null;
}

export function DocumentFormModal({
  isOpen,
  onClose,
  onSave,
  initialDocument,
  initialData,
}: DocumentFormModalProps) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const activeInitial = initialDocument || initialData;
  const isEdit = Boolean(activeInitial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(activeInitial?.name || "");
  const [reference, setReference] = useState(
    activeInitial?.reference || activeInitial?.documentNumber || `DOC${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [category, setCategory] = useState(activeInitial?.category || "Smlouva");
  const [description, setDescription] = useState(activeInitial?.description || "");

  // Uploaded file state
  const [fileName, setFileName] = useState(activeInitial?.fileName || "");
  const [fileContentLength, setFileContentLength] = useState(activeInitial?.fileContentLength || 0);
  const [fileContent, setFileContent] = useState(activeInitial?.fileContent || "");
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File reader helper
  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    setFileContentLength(file.size);
    if (!name.trim()) {
      setName(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 without prefix data:...;base64,
      const base64Data = result.includes(",") ? result.split(",")[1] : result;
      setFileContent(base64Data);
    };
    reader.onerror = () => {
      setErrorMessage("Nepodařilo se načíst obsah vybraného souboru.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název dokumentu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadDoc: DocumentItem = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      name: name.trim(),
      reference: reference.trim(),
      documentNumber: reference.trim(),
      category,
      createdOn: activeInitial?.createdOn || new Date().toISOString(),
      description: description.trim() || undefined,
      fileName: fileName.trim() || undefined,
      fileContentLength: fileContentLength || undefined,
      fileContent: fileContent || undefined,
      state: "Aktivní",
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/Documents/DMSDocuments/${payloadDoc.id}`
        : `/api/helios/v1/Documents/DMSDocuments`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDoc),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for DMS doc, saving locally:", res.status);
      }

      onSave(payloadDoc);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadDoc);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog animate-fade-in" style={{ maxWidth: "680px", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--accent-cyan), #0891b2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(6, 182, 212, 0.35)",
            }}>
              <FolderArchive size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava dokumentu" : "Nový DMS dokument"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Elektronický archiv smluv, příloh a dokladů
              </div>
            </div>
          </div>

          <button
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

        {errorMessage && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            color: "#fda4af",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-grid-2" style={{ marginBottom: "1rem" }}>
              <div>
                <label className="label-control">Evidenční číslo / Reference *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="např. SML-2026-01"
                />
              </div>

              <div>
                <label className="label-control">Kategorie dokumentu</label>
                <select
                  className="input-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Smlouva">Smlouva / Dohoda</option>
                  <option value="Faktura">Faktura / Daňový doklad</option>
                  <option value="Příloha">Příloha / Dodatek</option>
                  <option value="Manuál">Návod / Manuál</option>
                  <option value="Výkres">Technický výkres</option>
                  <option value="Ostatní">Ostatní</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label-control">Název dokumentu *</label>
              <input
                type="text"
                required
                className="input-control"
                style={{ fontSize: "1rem", fontWeight: 600 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Licenční smlouva k softwaru Nephrite"
              />
            </div>
          </div>

          {/* File Upload Drop Zone */}
          <div className="form-section">
            <div className="form-section-title">
              <UploadCloud size={15} />
              <span>Soubor dokumentu (PDF, obrázek, kancelářský formát)</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#0284c7" : "#cbd5e1"}`,
                borderRadius: "6px",
                padding: "2rem 1.5rem",
                textAlign: "center",
                background: isDragging ? "#f0f9ff" : "#f8fafc",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {fileName ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-primary)",
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{fileName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Velikost: {formatFileSize(fileContentLength)} • Kliknutím vyměníte soubor
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
                  <UploadCloud size={38} style={{ color: "var(--brand-primary)" }} />
                  <div style={{ fontWeight: 600 }}>
                    Přetáhněte soubor sem nebo <span style={{ color: "var(--brand-primary)", textDecoration: "underline" }}>vyberte z disku</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    Podporované formáty: PDF, JPG, PNG, DOCX, XLSX (max. 20 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Popis nebo poznámka k archivaci</label>
            <textarea
              className="input-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Doplňující informace, interní poznámky k dokumentu..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit dokument" : "Nahrát dokument"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
