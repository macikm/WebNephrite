"use client";

import { useState } from "react";
import { Customer } from "@/types/helios";
import { Search, Building, Phone, Mail, MapPin } from "lucide-react";

interface CustomersViewProps {
  customers: Customer[];
  isLoading: boolean;
}

export function CustomersView({ customers, isLoading }: CustomersViewProps) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.tin && c.tin.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.number && c.number.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Adresář partnerů a zákazníků</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              Databáze odběratelů, dodavatelů a kontaktních údajů
            </p>
          </div>

          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
              placeholder="Hledat podle názvu, IČO nebo města..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
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
                    Načítám zákazníky ze systému Helios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                    Žádní zákazníci neodpovídají zadanému filtru.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
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
        </div>
      </div>
    </div>
  );
}
