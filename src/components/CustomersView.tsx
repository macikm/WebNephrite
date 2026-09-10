"use client";

import { useState } from "react";
import { Customer, ContactPerson } from "@/types/helios";
import { 
  Search, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Briefcase, 
  Smartphone, 
  X, 
  CheckCircle2 
} from "lucide-react";

interface CustomersViewProps {
  customers: Customer[];
  contacts: ContactPerson[];
  isLoading: boolean;
}

export function CustomersView({ customers, contacts, isLoading }: CustomersViewProps) {
  const [activeTab, setActiveTab] = useState<"companies" | "contacts">("companies");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactPerson | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.tin && c.tin.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.number && c.number.toLowerCase().includes(term))
    );
  });

  const filteredContacts = contacts.filter((cp) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (cp.name && cp.name.toLowerCase().includes(term)) ||
      (cp.firstName && cp.firstName.toLowerCase().includes(term)) ||
      (cp.lastName && cp.lastName.toLowerCase().includes(term)) ||
      (cp.position && cp.position.toLowerCase().includes(term)) ||
      (cp.company?.name && cp.company.name.toLowerCase().includes(term)) ||
      (cp.number && cp.number.toLowerCase().includes(term)) ||
      (cp.phone && cp.phone.toLowerCase().includes(term)) ||
      (cp.email && cp.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header filter & search */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          {/* Subtabs toggle */}
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
            <button
              onClick={() => setActiveTab("companies")}
              className={`btn ${activeTab === "companies" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <Building size={14} />
              <span>Firmy & Partneři ({customers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`btn ${activeTab === "contacts" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <User size={14} />
              <span>Kontaktní osoby ({contacts.length})</span>
            </button>
          </div>

          {/* Search box */}
          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
              placeholder={activeTab === "companies" ? "Hledat podle názvu firmy, IČO nebo města..." : "Hledat podle jména, pozice, společnosti..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{
          marginTop: "1rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          gap: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}>
          <div>Záznamů celkem: <strong style={{ color: "var(--text-main)" }}>{activeTab === "companies" ? customers.length : contacts.length}</strong></div>
          <div>Filtrováno: <strong style={{ color: "var(--brand-primary)" }}>{activeTab === "companies" ? filteredCustomers.length : filteredContacts.length}</strong></div>
        </div>
      </div>

      {/* Main View */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          {activeTab === "companies" ? (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Číslo partnera</th>
                  <th>Název společnosti / Jméno</th>
                  <th>IČO</th>
                  <th>DIČ</th>
                  <th>Město</th>
                  <th>Kontakt</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám partnery ze systému Helios...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Žádní partneři neodpovídají zadanému filtru.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {c.number || c.referenceId || `#${c.id}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{c.tin || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{c.vatId || "—"}</td>
                      <td>
                        {c.city ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <MapPin size={13} style={{ color: "var(--text-dim)" }} />
                            <span>{c.city}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.75rem", color: "var(--text-muted)" }}>
                          {c.phone && (
                            <a href={`tel:${c.phone}`} title={c.phone} style={{ color: "var(--brand-primary)" }}>
                              <Phone size={14} />
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} title={c.email} style={{ color: "var(--accent-cyan)" }}>
                              <Mail size={14} />
                            </a>
                          )}
                          {!c.phone && !c.email && "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Kód osoby</th>
                  <th>Jméno a příjmení</th>
                  <th>Pozice / Funkce</th>
                  <th>Společnost</th>
                  <th>Telefon / Mobil</th>
                  <th>E-mail</th>
                  <th>Stav</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám kontaktní osoby ze systému Helios...
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Nebyly nalezeny žádné kontaktní osoby.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((cp) => (
                    <tr key={cp.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {cp.number || cp.reference || `#${cp.id}`}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "var(--brand-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}>
                            {cp.firstName ? cp.firstName[0] : (cp.name ? cp.name[0] : "K")}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {cp.titlePre ? `${cp.titlePre} ` : ""}{cp.name || `${cp.firstName || ""} ${cp.lastName || ""}`.trim()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {cp.position ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)" }}>
                            <Briefcase size={13} style={{ color: "var(--text-dim)" }} />
                            <span>{cp.position}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {cp.company?.name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Building size={13} style={{ color: "var(--accent-cyan)" }} />
                            <span style={{ fontWeight: 500 }}>{cp.company.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>Nespecifikováno</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {(cp.phone || cp.mobilePhone) ? (
                            <a
                              href={`tel:${cp.mobilePhone || cp.phone}`}
                              style={{ color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}
                            >
                              <Phone size={13} />
                              <span>{cp.mobilePhone || cp.phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: "var(--text-dim)" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {cp.email ? (
                          <a
                            href={`mailto:${cp.email}`}
                            style={{ color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}
                          >
                            <Mail size={13} />
                            <span>{cp.email}</span>
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-dim)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-paid">
                          <CheckCircle2 size={12} />
                          <span>Aktivní</span>
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedContact(cp)}
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contact Person Detail Modal */}
      {selectedContact && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "1.5rem",
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: "100%",
            maxWidth: "540px",
            padding: "2rem",
            background: "rgba(18, 26, 42, 0.98)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-primary)",
                }}>
                  <User size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                    {selectedContact.titlePre ? `${selectedContact.titlePre} ` : ""}
                    {selectedContact.name || `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim()}
                  </h2>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    Kód: {selectedContact.number || selectedContact.reference || `#${selectedContact.id}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
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
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Pracovní pozice / Funkce:</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem" }}>
                    {selectedContact.position || "Nespecifikováno"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Společnost / Zaměstnavatel:</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem", color: "var(--accent-cyan)" }}>
                    {selectedContact.company?.name || "Není přiřazena"}
                    {selectedContact.company?.number && (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginLeft: "0.4rem" }}>
                        ({selectedContact.company.number})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.25rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Telefon:</div>
                    <div style={{ fontWeight: 500, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {selectedContact.phone || selectedContact.mobilePhone || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>E-mail:</div>
                    <div style={{ fontWeight: 500, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {selectedContact.email || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {selectedContact.note && (
                <div style={{
                  padding: "0.85rem",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}>
                  Poznámka: {selectedContact.note}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  onClick={() => setSelectedContact(null)}
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
  );
}
