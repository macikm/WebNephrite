"use client";

import { useState } from "react";
import { X, Package, Save, AlertCircle, Barcode, DollarSign } from "lucide-react";
import { Product } from "@/types/helios";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
  initialData?: Product | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  initialData,
}: ProductFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialProduct || initialData;
  const isEdit = Boolean(activeInitial);

  const [name, setName] = useState(activeInitial?.name || "");
  const [referenceId, setReferenceId] = useState(
    activeInitial?.referenceId || `PRD-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const [typeCode, setTypeCode] = useState(activeInitial?.typeCode || "Zboží");
  const [barcode, setBarcode] = useState(activeInitial?.barcode || "");
  const [measureUnit, setMeasureUnit] = useState(activeInitial?.measureUnit || "ks");
  const [vatRate, setVatRate] = useState<number>(activeInitial?.vatRate ?? 21);
  const [price, setPrice] = useState<number>(
    activeInitial?.price ?? activeInitial?.unitPrice ?? 100
  );
  const [statusCode, setStatusCode] = useState(activeInitial?.statusCode || "Aktivní");
  const [description, setDescription] = useState(activeInitial?.description || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název produktu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadProduct: Product = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      name: name.trim(),
      referenceId: referenceId.trim(),
      typeCode,
      barcode: barcode.trim() || undefined,
      measureUnit,
      vatRate,
      price,
      unitPrice: price,
      statusCode,
      description: description.trim() || undefined,
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/general/products/${payloadProduct.id}`
        : `/api/helios/v1/general/products`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadProduct),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status, updating locally:", res.status);
      }

      onSave(payloadProduct);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadProduct);
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
              background: "linear-gradient(135deg, var(--brand-primary), #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
            }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava produktu" : "Nový produkt / položka"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Katalog zboží, materiálu a ceníkových služeb
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
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
          >
            <X size={18} />
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
                <label className="label-control">Kód položky / Reference *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="např. PRD-1001"
                />
              </div>

              <div>
                <label className="label-control">Typ položky</label>
                <select
                  className="input-control"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                >
                  <option value="Zboží">Zboží (skladové)</option>
                  <option value="Služba">Služba / Práce</option>
                  <option value="Materiál">Materiál</option>
                  <option value="Výrobek">Vlastní výrobek</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label-control">Název produktu / položky *</label>
              <input
                type="text"
                required
                className="input-control"
                style={{ fontSize: "1rem", fontWeight: 600 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Monitor Dell UltraSharp 27''"
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">Čárový kód (EAN / Barcode)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-control"
                    style={{ fontFamily: "var(--font-mono)" }}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="8594000112233"
                  />
                  <Barcode size={16} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">Stav v systému</label>
                <select
                  className="input-control"
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                >
                  <option value="Aktivní">Aktivní</option>
                  <option value="Neaktivní">Neaktivní</option>
                  <option value="Doprodáno">Doprodáno</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Units */}
          <div className="form-section">
            <div className="form-grid-3">
              <div>
                <label className="label-control">Měrná jednotka</label>
                <select
                  className="input-control"
                  value={measureUnit}
                  onChange={(e) => setMeasureUnit(e.target.value)}
                >
                  <option value="ks">ks (kusy)</option>
                  <option value="hod">hod (hodiny)</option>
                  <option value="kg">kg (kilogramy)</option>
                  <option value="m">m (metry)</option>
                  <option value="l">l (litry)</option>
                  <option value="bal">bal (balení)</option>
                  <option value="kpl">kpl (komplet)</option>
                </select>
              </div>

              <div>
                <label className="label-control">Sazba DPH</label>
                <select
                  className="input-control"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                >
                  <option value={21}>21 % (Základní)</option>
                  <option value={12}>12 % (Snížená)</option>
                  <option value={0}>0 % (Osvobozeno)</option>
                </select>
              </div>

              <div>
                <label className="label-control">Cena bez DPH (Kč) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input-control"
                  style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--brand-primary)" }}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Popis a technická specifikace</label>
            <textarea
              className="input-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailní specifikace, parametry nebo doplňující informace..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit produkt" : "Vytvořit produkt"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
