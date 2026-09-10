"use client";

import { useState } from "react";
import { JobOrder, JobTask } from "@/types/helios";
import { Search, Briefcase, CheckSquare, Clock } from "lucide-react";

interface JobsViewProps {
  jobOrders: JobOrder[];
  tasks: JobTask[];
  isLoading: boolean;
}

export function JobsView({ jobOrders, tasks, isLoading }: JobsViewProps) {
  const [subType, setSubType] = useState<"jobs" | "tasks">("jobs");
  const [search, setSearch] = useState("");

  const filteredJobs = jobOrders.filter((j) => {
    const term = search.toLowerCase().trim();
    return !term || (j.name && j.name.toLowerCase().includes(term)) || (j.number && j.number.toLowerCase().includes(term));
  });

  const filteredTasks = tasks.filter((t) => {
    const term = search.toLowerCase().trim();
    return !term || (t.name && t.name.toLowerCase().includes(term)) || (t.assignedTo && t.assignedTo.toLowerCase().includes(term));
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
            <button
              onClick={() => setSubType("jobs")}
              className={`btn ${subType === "jobs" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <span>Zakázky ({jobOrders.length})</span>
            </button>
            <button
              onClick={() => setSubType("tasks")}
              className={`btn ${subType === "tasks" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              <span>Úkoly & Realizace ({tasks.length})</span>
            </button>
          </div>

          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
              placeholder={subType === "jobs" ? "Hledat zakázku..." : "Hledat úkol..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <div className="table-wrapper">
          {subType === "jobs" ? (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Číslo zakázky</th>
                  <th>Název zakázky</th>
                  <th>Klient</th>
                  <th>Zahájení</th>
                  <th>Termín ukončení</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám zakázky z Heliosu...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Žádné zakázky k zobrazení.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{j.number}</td>
                      <td style={{ fontWeight: 600 }}>{j.name}</td>
                      <td>{j.customer?.name || "Interní"}</td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {j.startDate ? new Date(j.startDate).toLocaleDateString("cs-CZ") : "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {j.endDate ? new Date(j.endDate).toLocaleDateString("cs-CZ") : "—"}
                      </td>
                      <td>
                        <span className="badge badge-paid">
                          <CheckSquare size={12} />
                          <span>{j.statusCode || "V řešení"}</span>
                        </span>
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
                  <th>Číslo úkolu</th>
                  <th>Název úkolu</th>
                  <th>Odpovědná osoba</th>
                  <th>Plánováno hod.</th>
                  <th>Vykázáno hod.</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Načítám úkoly...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                      Žádné úkoly k zobrazení.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{t.number || `#${t.id}`}</td>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td>{t.assignedTo || "Nepřiřazeno"}</td>
                      <td>{t.plannedHours != null ? `${t.plannedHours} h` : "—"}</td>
                      <td style={{ fontWeight: 600, color: "var(--brand-primary)" }}>{t.spentHours != null ? `${t.spentHours} h` : "—"}</td>
                      <td>
                        <span className="badge badge-info">
                          <Clock size={12} />
                          <span>{t.statusCode || "V řešení"}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
