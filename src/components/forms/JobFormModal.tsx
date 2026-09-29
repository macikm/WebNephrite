"use client";

import { useState } from "react";
import { X, Briefcase, Save, AlertCircle, Calendar } from "lucide-react";
import { JobOrder, Customer } from "@/types/helios";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobOrder) => void;
  initialJob?: JobOrder | null;
  initialData?: JobOrder | null;
  customers?: Customer[];
}

export function JobFormModal({
  isOpen,
  onClose,
  onSave,
  initialJob,
  initialData,
  customers = [],
}: JobFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialJob || initialData;
  const isEdit = Boolean(activeInitial);

  const [number, setNumber] = useState(
    activeInitial?.number || `ZAK${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [name, setName] = useState(activeInitial?.name || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    activeInitial?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    activeInitial?.customer?.name || ""
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    activeInitial?.startDate ? activeInitial.startDate.split("T")[0] : todayStr
  );
  const [endDate, setEndDate] = useState(
    activeInitial?.endDate ? activeInitial.endDate.split("T")[0] : in30Days
  );

  const [budget, setBudget] = useState<number>(activeInitial?.budget || 50000);
  const [statusCode, setStatusCode] = useState(activeInitial?.statusCode || "V řešení");
  const [note, setNote] = useState(activeInitial?.note || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCustomerSelect = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId("");
      return;
    }
    const id = Number(idStr);
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomCustomerName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název zakázky.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || undefined;
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payloadJob: JobOrder = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      number: number.trim(),
      name: name.trim(),
      customer: partnerName ? { id: partnerId, name: partnerName } : undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      budget,
      statusCode,
      note: note.trim() || undefined,
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/jobOrder/jobOrders/${payloadJob.id}`
        : `/api/helios/v1/jobOrder/jobOrders`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadJob),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for job, saving locally:", res.status);
      }

      onSave(payloadJob);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadJob);
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
              background: "linear-gradient(135deg, var(--accent-amber), #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.35)",
            }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava zakázky" : "Nová zakázka"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Projekt, realizace nebo klientská zakázka
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
                <label className="label-control">Číslo zakázky *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="např. ZAK-2026-001"
                />
              </div>

              <div>
                <label className="label-control">Stav zakázky</label>
                <select
                  className="input-control"
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                >
                  <option value="V přípravě">V přípravě</option>
                  <option value="V řešení">V řešení</option>
                  <option value="Realizováno">Realizováno</option>
                  <option value="Fakturováno">Fakturováno</option>
                  <option value="Uzavřeno">Uzavřeno</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label-control">Název zakázky / projektu *</label>
              <input
                type="text"
                required
                className="input-control"
                style={{ fontSize: "1rem", fontWeight: 600 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Implementace ERP modulu skladového hospodářství"
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">Klient / Zákazník ze systému</label>
                <select
                  className="input-control"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">— Interní / Vyberte partnera —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-control">Název klienta</label>
                <input
                  type="text"
                  className="input-control"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Interní projekt nebo jméno klienta..."
                />
              </div>
            </div>
          </div>

          {/* Dates & Budget */}
          <div className="form-section">
            <div className="form-grid-3">
              <div>
                <label className="label-control">Datum zahájení</label>
                <input
                  type="date"
                  className="input-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Termín dokončení</label>
                <input
                  type="date"
                  className="input-control"
                  style={{ color: "var(--accent-amber)", fontWeight: 600 }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Rozpočet / Plán (Kč)</label>
                <input
                  type="number"
                  step="any"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Popis a rozsah prací</label>
            <textarea
              className="input-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cíle projektu, specifikace etap, harmonogram..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit zakázku" : "Vytvořit zakázku"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
