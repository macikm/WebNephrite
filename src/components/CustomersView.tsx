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
  X, 
  CheckCircle2,
  Eye
} from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { 
  SortDirection, 
  sortData, 
  safeString 
} from "@/lib/table-utils";

interface CustomersViewProps {
  customers: Customer[];
  contacts: ContactPerson[];
  isLoading: boolean;
}

export function CustomersView({ customers, contacts, isLoading }: CustomersViewProps) {
  const [activeTab, setActiveTab] = useState<"companies" | "contacts">("companies");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactPerson | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      safeString(c.name, "").toLowerCase().includes(term) ||
      safeString(c.tin, "").toLowerCase().includes(term) ||
      safeString(c.city, "").toLowerCase().includes(term) ||
      safeString(c.number, "").toLowerCase().includes(term)
    );
  });

  const filteredContacts = contacts.filter((cp) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const name = safeString(cp.name || `${cp.firstName || ""} ${cp.lastName || ""}`, "").toLowerCase();
    const position = safeString(cp.position, "").toLowerCase();
    const company = safeString(cp.company?.name, "").toLowerCase();
    const phone = safeString(cp.phone || cp.mobilePhone, "").toLowerCase();
    const email = safeString(cp.email, "").toLowerCase();

    return name.includes(term) || position.includes(term) || company.includes(term) || phone.includes(term) || email.includes(term);
  });

  const sortedCustomers = sortData(filteredCustomers, sortKey, sortDirection);
  const sortedContacts = sortData(filteredContacts, sortKey, sortDirection);

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení adresáře CRM">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Header filter & search */}
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            {/* Subtabs toggle */}
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
              <button
                onClick={() => { setActiveTab("companies"); setSortKey("name"); }}
                className={`btn ${activeTab === "companies" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              >
                <Building size={14} />
                <span>Firmy & Partneři ({customers.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab("contacts"); setSortKey("name"); }}
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

        {/* Main Table with horizontal scroll */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div className="table-wrapper">
            {activeTab === "companies" ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th style={{ width: "85px", textAlign: "center" }}>Detail</th>
                    <SortableHeader
                      label="Číslo partnera"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Název společnosti / Jméno"
                      columnKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="IČO"
                      columnKey="tin"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="DIČ"
                      columnKey="vatId"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Město"
                      columnKey="city"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <th>Kontakt</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Načítám partnery ze systému Helios...
                      </td>
                    </tr>
                  ) : sortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Žádní partneři neodpovídají zadanému filtru.
                      </td>
                    </tr>
                  ) : (
                    sortedCustomers.map((c) => (
                      <tr key={c.id}>
                        {/* Detail in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                            title="Zobrazit detail partnera"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {safeString(c.number || c.referenceId, `#${c.id}`)}
                        </td>
                        <td style={{ fontWeight: 600 }}>{safeString(c.name)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{safeString(c.tin)}</td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{safeString(c.vatId)}</td>
                        <td>
                          {c.city ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <MapPin size={13} style={{ color: "var(--text-dim)" }} />
                              <span>{safeString(c.city)}</span>
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
                    <th style={{ width: "85px", textAlign: "center" }}>Detail</th>
                    <SortableHeader
                      label="Kód osoby"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Jméno a příjmení"
                      columnKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Pozice / Funkce"
                      columnKey="position"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Společnost"
                      columnKey="company.name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <th>Telefon / Mobil</th>
                    <th>E-mail</th>
                    <th>Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Načítám kontaktní osoby ze systému Helios...
                      </td>
                    </tr>
                  ) : sortedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Nebyly nalezeny žádné kontaktní osoby.
                      </td>
                    </tr>
                  ) : (
                    sortedContacts.map((cp) => {
                      const initial = cp.firstName ? cp.firstName[0] : (cp.name ? cp.name[0] : "K");
                      const phoneStr = safeString(cp.mobilePhone || cp.phone, "");
                      const emailStr = safeString(cp.email, "");

                      return (
                        <tr key={cp.id}>
                          {/* Detail in 1st column */}
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={() => setSelectedContact(cp)}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", gap: "0.3rem" }}
                              title="Zobrazit detail kontaktu"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </button>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {safeString(cp.number || cp.reference, `#${cp.id}`)}
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
                                {initial}
                              </div>
                              <div style={{ fontWeight: 600 }}>
                                {cp.titlePre ? `${cp.titlePre} ` : ""}{safeString(cp.name || `${cp.firstName || ""} ${cp.lastName || ""}`)}
                              </div>
                            </div>
                          </td>
                          <td>
                            {cp.position ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)" }}>
                                <Briefcase size={13} style={{ color: "var(--text-dim)" }} />
                                <span>{safeString(cp.position)}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {cp.company?.name ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Building size={13} style={{ color: "var(--accent-cyan)" }} />
                                <span style={{ fontWeight: 500 }}>{safeString(cp.company.name)}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>Nespecifikováno</span>
                            )}
                          </td>
                          <td>
                            {phoneStr ? (
                              <a
                                href={`tel:${phoneStr}`}
                                style={{ color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}
                              >
                                <Phone size={13} />
                                <span>{phoneStr}</span>
                              </a>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {emailStr ? (
                              <a
                                href={`mailto:${emailStr}`}
                                style={{ color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}
                              >
                                <Mail size={13} />
                                <span>{emailStr}</span>
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Robust Contact Person Detail Modal */}
        {selectedContact && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedContact(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "560px", padding: "2rem" }}>
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
                      {safeString(selectedContact.name || `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`, "Kontaktní osoba")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Kód: {safeString(selectedContact.number || selectedContact.reference, `#${selectedContact.id}`)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
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
                  title="Zavřít"
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
                      {safeString(selectedContact.position, "Nespecifikováno")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Společnost / Zaměstnavatel:</div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem", color: "var(--accent-cyan)" }}>
                      {safeString(selectedContact.company?.name, "Není přiřazena")}
                      {selectedContact.company?.number && (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginLeft: "0.4rem" }}>
                          ({safeString(selectedContact.company.number)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.25rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Telefon / Mobil:</div>
                      <div style={{ fontWeight: 500, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        {safeString(selectedContact.phone || selectedContact.mobilePhone, "—")}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>E-mail:</div>
                      <div style={{ fontWeight: 500, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        {safeString(selectedContact.email, "—")}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedContact.note && typeof selectedContact.note === "string" && selectedContact.note.trim() && (
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

        {/* Robust Customer Detail Modal */}
        {selectedCustomer && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCustomer(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "560px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))",
                    border: "1px solid rgba(6, 182, 212, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-cyan)",
                  }}>
                    <Building size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                      {safeString(selectedCustomer.name, "Detail partnera")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Kód: {safeString(selectedCustomer.number || selectedCustomer.referenceId, `#${selectedCustomer.id}`)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
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
                  title="Zavřít"
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
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.85rem",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>IČO:</div>
                    <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.tin, "—")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>DIČ:</div>
                    <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.vatId, "—")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Město:</div>
                    <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.city, "—")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Ulice a PSČ:</div>
                    <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.street, "")} {safeString(selectedCustomer.zipCode, "")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Telefon:</div>
                    <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.phone, "—")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>E-mail:</div>
                    <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                      {safeString(selectedCustomer.email, "—")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedCustomer(null)}
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
    </ErrorBoundary>
  );
}
