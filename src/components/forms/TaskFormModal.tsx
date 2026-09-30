"use client";

import { useState } from "react";
import { X, CheckSquare, Save, AlertCircle, Clock, User, Briefcase } from "lucide-react";
import { JobTask, JobOrder } from "@/types/helios";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: JobTask) => void;
  initialTask?: JobTask | null;
  initialData?: JobTask | null;
  jobOrders?: JobOrder[];
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  initialData,
  jobOrders = [],
}: TaskFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialTask || initialData;
  const isEdit = Boolean(activeInitial);

  const [name, setName] = useState(activeInitial?.name || "");
  const [number, setNumber] = useState(
    activeInitial?.number || `UK-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const [jobOrderId, setJobOrderId] = useState<number | "">(
    activeInitial?.jobOrderId || (jobOrders[0]?.id || "")
  );
  const [assignedTo, setAssignedTo] = useState(activeInitial?.assignedTo || "");
  const [plannedHours, setPlannedHours] = useState<number>(activeInitial?.plannedHours || 8);
  const [spentHours, setSpentHours] = useState<number>(activeInitial?.spentHours || 0);
  const [statusCode, setStatusCode] = useState(activeInitial?.statusCode || "V řešení");
  const [description, setDescription] = useState(activeInitial?.description || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název úkolu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadTask: JobTask = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      number: number.trim(),
      name: name.trim(),
      jobOrderId: typeof jobOrderId === "number" ? jobOrderId : undefined,
      assignedTo: assignedTo.trim() || undefined,
      plannedHours,
      spentHours,
      statusCode,
      description: description.trim() || undefined,
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/jobOrder/tasks/${payloadTask.id}`
        : `/api/helios/v1/jobOrder/tasks`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadTask),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for task, saving locally:", res.status);
      }

      onSave(payloadTask);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadTask);
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
      <div className="modal-dialog animate-fade-in" style={{ maxWidth: "650px", padding: "2rem" }}>
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
              <CheckSquare size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava úkolu" : "Nový pracovní úkol"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Pracovní činnost, etapa zakázky nebo zadání
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
                <label className="label-control">Kód úkolu</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="UK-1001"
                />
              </div>

              <div>
                <label className="label-control">Stav realizace</label>
                <select
                  className="input-control"
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                >
                  <option value="Nový">Nový / K řešení</option>
                  <option value="V řešení">V řešení</option>
                  <option value="Testování">Testování / Revize</option>
                  <option value="Dokončeno">Dokončeno</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label-control">Název úkolu *</label>
              <input
                type="text"
                required
                className="input-control"
                style={{ fontSize: "1rem", fontWeight: 600 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Příprava databázové struktury a migračního skriptu"
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">Přiřazeno k zakázce</label>
                <select
                  className="input-control"
                  value={jobOrderId}
                  onChange={(e) => setJobOrderId(Number(e.target.value))}
                >
                  <option value="">— Bez vazby na zakázku —</option>
                  {jobOrders.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-control">Řešitel / Odpovědná osoba</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-control"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="např. Martin Macko"
                  />
                  <User size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="form-section">
            <div className="form-grid-2">
              <div>
                <label className="label-control">Plánovaný rozsah (hodiny)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step="any"
                    className="input-control"
                    style={{ fontWeight: 600 }}
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(parseFloat(e.target.value) || 0)}
                  />
                  <Clock size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">Skutečně odpracováno (hodiny)</label>
                <input
                  type="number"
                  step="any"
                  className="input-control"
                  style={{ fontWeight: 600, color: "var(--brand-primary)" }}
                  value={spentHours}
                  onChange={(e) => setSpentHours(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Podrobný popis zadání</label>
            <textarea
              className="input-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kritéria akceptace, postup řešení nebo odkaz na specifikaci..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit úkol" : "Vytvořit úkol"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
