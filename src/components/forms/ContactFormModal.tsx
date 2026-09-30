"use client";

import { useState } from "react";
import { X, User, Save, AlertCircle, Phone, Mail, Building, Briefcase } from "lucide-react";
import { ContactPerson, Customer } from "@/types/helios";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactPerson) => void;
  initialContact?: ContactPerson | null;
  initialData?: ContactPerson | null;
  customers?: Customer[];
  companies?: Customer[];
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSave,
  initialContact,
  initialData,
  customers = [],
  companies = [],
}: ContactFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialContact || initialData;
  const companyList = companies.length > 0 ? companies : customers;
  const isEdit = Boolean(activeInitial);

  const [firstName, setFirstName] = useState(activeInitial?.firstName || "");
  const [lastName, setLastName] = useState(activeInitial?.lastName || activeInitial?.name || "");
  const [titlePre, setTitlePre] = useState(activeInitial?.titlePre || "");
  const [position, setPosition] = useState(activeInitial?.position || "");
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">(
    activeInitial?.company?.id || ""
  );
  const [customCompanyName, setCustomCompanyName] = useState(
    activeInitial?.company?.name || ""
  );

  const [phone, setPhone] = useState(activeInitial?.phone || "");
  const [mobilePhone, setMobilePhone] = useState(activeInitial?.mobilePhone || "");
  const [email, setEmail] = useState(activeInitial?.email || "");
  const [note, setNote] = useState(activeInitial?.note || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCompanySelect = (idStr: string) => {
    if (!idStr) {
      setSelectedCompanyId("");
      return;
    }
    const id = Number(idStr);
    setSelectedCompanyId(id);
    const found = companyList.find((c) => c.id === id);
    if (found) {
      setCustomCompanyName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) {
      setErrorMessage("Vyplňte prosím příjmení kontaktní osoby.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const fullName = `${titlePre ? `${titlePre} ` : ""}${firstName} ${lastName}`.trim();
    const compName = customCompanyName.trim() || undefined;
    const compId = typeof selectedCompanyId === "number" ? selectedCompanyId : undefined;

    const payloadContact: ContactPerson = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      name: fullName,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim(),
      titlePre: titlePre.trim() || undefined,
      position: position.trim() || undefined,
      phone: phone.trim() || undefined,
      mobilePhone: mobilePhone.trim() || undefined,
      email: email.trim() || undefined,
      company: compName ? { id: compId, name: compName } : undefined,
      note: note.trim() || undefined,
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/general/contacts/${payloadContact.id}`
        : `/api/helios/v1/general/contacts`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadContact),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for contact, saving locally:", res.status);
      }

      onSave(payloadContact);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadContact);
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
              background: "linear-gradient(135deg, var(--accent-purple), #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.35)",
            }}>
              <User size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava kontaktu" : "Nová kontaktní osoba"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Zástupce klienta, partnera nebo dodavatele
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
            <div className="form-grid-3" style={{ marginBottom: "1rem" }}>
              <div style={{ maxWidth: "120px" }}>
                <label className="label-control">Titul</label>
                <input
                  type="text"
                  className="input-control"
                  value={titlePre}
                  onChange={(e) => setTitlePre(e.target.value)}
                  placeholder="Ing., Mgr."
                />
              </div>

              <div>
                <label className="label-control">Jméno</label>
                <input
                  type="text"
                  className="input-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jan"
                />
              </div>

              <div>
                <label className="label-control">Příjmení *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontWeight: 600 }}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Novák"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">Pracovní pozice / Funkce</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-control"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="např. Vedoucí nákupu, CEO"
                  />
                  <Briefcase size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">Přiřazená společnost</label>
                <select
                  className="input-control"
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                >
                  <option value="">— Vyberte firmu z adresáře —</option>
                  {companyList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spojení */}
          <div className="form-section">
            <div className="form-grid-3">
              <div>
                <label className="label-control">Mobilní telefon</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    className="input-control"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    placeholder="+420 777 123 456"
                  />
                  <Phone size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>

              <div>
                <label className="label-control">Pevná linka / Telefon</label>
                <input
                  type="tel"
                  className="input-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+420 222 333 444"
                />
              </div>

              <div>
                <label className="label-control">E-mail</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    className="input-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="novak@firma.cz"
                  />
                  <Mail size={15} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Poznámka</label>
            <textarea
              className="input-control"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Doplňující informace, preference kontaktu..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušit
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: "150px" }}>
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit kontakt" : "Vytvořit kontakt"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
