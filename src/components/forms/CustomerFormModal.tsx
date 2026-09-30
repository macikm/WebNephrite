"use client";

import { useState } from "react";
import { X, Building, Save, AlertCircle, Phone, Mail, Globe, MapPin } from "lucide-react";
import { Customer } from "@/types/helios";
import { useEscapeKey } from "@/lib/useEscapeKey";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  initialCustomer?: Customer | null;
  initialData?: Customer | null;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
  initialData,
}: CustomerFormModalProps) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const activeInitial = initialCustomer || initialData;
  const isEdit = Boolean(activeInitial);

  const [name, setName] = useState(activeInitial?.name || "");
  const [number, setNumber] = useState(
    activeInitial?.number || activeInitial?.referenceId || `COC${String(Math.floor(Math.random() * 90000) + 10000)}`
  );
  const [tin, setTin] = useState(activeInitial?.tin || "");
  const [vatId, setVatId] = useState(activeInitial?.vatId || "");
  const [street, setStreet] = useState(activeInitial?.street || "");
  const [city, setCity] = useState(activeInitial?.city || "");
  const [zipCode, setZipCode] = useState(activeInitial?.zipCode || "");
  const [country, setCountry] = useState(activeInitial?.country || "CZ");
  const [phone, setPhone] = useState(activeInitial?.phone || "");
  const [email, setEmail] = useState(activeInitial?.email || "");
  const [web, setWeb] = useState(activeInitial?.web || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název společnosti.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadCustomer: Customer = {
      id: initialCustomer?.id || Math.floor(Math.random() * 90000) + 10000,
      number: number.trim(),
      referenceId: number.trim(),
      name: name.trim(),
      tin: tin.trim() || undefined,
      vatId: vatId.trim() || undefined,
      street: street.trim() || undefined,
      city: city.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      country: country.trim() || "CZ",
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      web: web.trim() || undefined,
      turnoverFV: initialCustomer?.turnoverFV || 0,
      turnoverFD: initialCustomer?.turnoverFD || 0,
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/general/companies/${payloadCustomer.id}`
        : `/api/helios/v1/general/companies`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCustomer),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for company, saving locally:", res.status);
      }

      onSave(payloadCustomer);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadCustomer);
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
              <Building size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava partnera" : "Nový partner / společnost"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Záznam v centrálním adresáři CRM
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
                <label className="label-control">Obchodní název firmy *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="např. ACME Czech s.r.o."
                />
              </div>

              <div>
                <label className="label-control">Kód partnera / Reference</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="např. COC0001"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">IČO</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="label-control">DIČ</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  placeholder="CZ12345678"
                />
              </div>
            </div>
          </div>

          {/* Sídlo firmy */}
          <div className="form-section">
            <div className="form-section-title">
              <MapPin size={15} />
              <span>Sídlo / Adresa společnosti</span>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label-control">Ulice a číslo popisné</label>
              <input
                type="text"
                className="input-control"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="např. Běhounkova 2344/27"
              />
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Město</label>
                <input
                  type="text"
                  className="input-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Praha 5"
                />
              </div>

              <div>
                <label className="label-control">PSČ</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="158 00"
                />
              </div>

              <div>
                <label className="label-control">Země</label>
                <select
                  className="input-control"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="CZ">Česká republika (CZ)</option>
                  <option value="SK">Slovensko (SK)</option>
                  <option value="DE">Německo (DE)</option>
                  <option value="AT">Rakousko (AT)</option>
                  <option value="PL">Polsko (PL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kontakty */}
          <div className="form-section">
            <div className="form-grid-3">
              <div>
                <label className="label-control">Telefon</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    className="input-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 222 333 444"
                  />
                  <Phone size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">E-mail</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    className="input-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@firma.cz"
                  />
                  <Mail size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">Webové stránky</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-control"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    placeholder="https://firma.cz"
                  />
                  <Globe size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit partnera" : "Vytvořit partnera"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
