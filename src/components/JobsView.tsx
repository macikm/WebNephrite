"use client";

import { useState } from "react";
import { JobOrder, JobTask, Customer } from "@/types/helios";
import { Search, Briefcase, CheckSquare, Clock, Eye, X, User, Plus, Edit3 } from "lucide-react";
import { SortableHeader } from "./SortableHeader";
import { Pagination } from "./Pagination";
import { ErrorBoundary } from "./ErrorBoundary";
import { JobFormModal } from "./forms/JobFormModal";
import { TaskFormModal } from "./forms/TaskFormModal";
import { SortDirection, sortData, safeString, safeNumber, safeDate } from "@/lib/table-utils";

interface JobsViewProps {
  jobOrders: JobOrder[];
  tasks: JobTask[];
  isLoading: boolean;
  customers?: Customer[];
  onSaveJob?: (job: JobOrder) => void;
  onSaveTask?: (task: JobTask) => void;
}

export function JobsView({ 
  jobOrders, 
  tasks, 
  isLoading,
  customers = [],
  onSaveJob,
  onSaveTask
}: JobsViewProps) {
  const [subType, setSubType] = useState<"jobs" | "tasks">("jobs");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [selectedTask, setSelectedTask] = useState<JobTask | null>(null);

  // Form modal states
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<JobTask | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredJobs = jobOrders.filter((j) => {
    const term = search.toLowerCase().trim();
    return !term || safeString(j.name, "").toLowerCase().includes(term) || safeString(j.number, "").toLowerCase().includes(term);
  });

  const filteredTasks = tasks.filter((t) => {
    const term = search.toLowerCase().trim();
    return !term || safeString(t.name, "").toLowerCase().includes(term) || safeString(t.assignedTo, "").toLowerCase().includes(term);
  });

  const sortedJobs = sortData(filteredJobs, sortKey, sortDirection);
  const sortedTasks = sortData(filteredTasks, sortKey, sortDirection);

  const currentTotal = subType === "jobs" ? sortedJobs.length : sortedTasks.length;
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedTasks = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení zakázek a úkolů">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(10, 15, 25, 0.7)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
              <button
                onClick={() => { setSubType("jobs"); setSortKey("number"); setCurrentPage(1); }}
                className={`btn ${subType === "jobs" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              >
                <span>Zakázky ({jobOrders.length})</span>
              </button>
              <button
                onClick={() => { setSubType("tasks"); setSortKey("number"); setCurrentPage(1); }}
                className={`btn ${subType === "tasks" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              >
                <span>Úkoly & Realizace ({tasks.length})</span>
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: "1 1 400px", justifyContent: "flex-end" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "400px" }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                  placeholder={subType === "jobs" ? "Hledat zakázku podle čísla či názvu..." : "Hledat úkol..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {subType === "jobs" ? (
                <button
                  onClick={() => {
                    setEditingJob(null);
                    setIsJobFormOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", gap: "0.4rem", whiteSpace: "nowrap" }}
                >
                  <Plus size={16} />
                  <span>Nová zakázka</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskFormOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", gap: "0.4rem", whiteSpace: "nowrap" }}
                >
                  <Plus size={16} />
                  <span>Nový úkol</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table with horizontal scroll */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div className="table-wrapper">
            {subType === "jobs" ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th style={{ width: "135px", textAlign: "center" }}>Akce</th>
                    <SortableHeader
                      label="Číslo zakázky"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Název zakázky"
                      columnKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Klient"
                      columnKey="customer.name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Zahájení"
                      columnKey="startDate"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Termín ukončení"
                      columnKey="endDate"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Stav"
                      columnKey="statusCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Načítám zakázky z Heliosu...
                      </td>
                    </tr>
                  ) : sortedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Žádné zakázky k zobrazení.
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((j) => (
                      <tr key={j.id}>
                        {/* Detail and Edit in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                            <button
                              onClick={() => setSelectedJob(j)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Zobrazit detail zakázky"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingJob(j);
                                setIsJobFormOpen(true);
                              }}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Upravit zakázku"
                            >
                              <Edit3 size={13} />
                              <span>Upravit</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{safeString(j.number, `#${j.id}`)}</td>
                        <td style={{ fontWeight: 600 }}>{safeString(j.name)}</td>
                        <td>{safeString(j.customer?.name, "Interní")}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {safeDate(j.startDate)}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {safeDate(j.endDate)}
                        </td>
                        <td>
                          <span className="badge badge-paid">
                            <CheckSquare size={12} />
                            <span>{safeString(j.statusCode, "V řešení")}</span>
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
                    <th style={{ width: "135px", textAlign: "center" }}>Akce</th>
                    <SortableHeader
                      label="Číslo úkolu"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Název úkolu"
                      columnKey="name"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Odpovědná osoba"
                      columnKey="assignedTo"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Plánováno hod."
                      columnKey="plannedHours"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Vykázáno hod."
                      columnKey="spentHours"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Stav"
                      columnKey="statusCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Načítám úkoly...
                      </td>
                    </tr>
                  ) : sortedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-dim)" }}>
                        Žádné úkoly k zobrazení.
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((t) => (
                      <tr key={t.id}>
                        {/* Detail and Edit in 1st column */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                            <button
                              onClick={() => setSelectedTask(t)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Zobrazit detail úkolu"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingTask(t);
                                setIsTaskFormOpen(true);
                              }}
                              className="btn btn-primary"
                              style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", gap: "0.25rem" }}
                              title="Upravit úkol"
                            >
                              <Edit3 size={13} />
                              <span>Upravit</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{safeString(t.number, `#${t.id}`)}</td>
                        <td style={{ fontWeight: 600 }}>{safeString(t.name)}</td>
                        <td>{safeString(t.assignedTo, "Nepřiřazeno")}</td>
                        <td>{t.plannedHours != null ? `${safeNumber(t.plannedHours)} h` : "—"}</td>
                        <td style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
                          {t.spentHours != null ? `${safeNumber(t.spentHours)} h` : "—"}
                        </td>
                        <td>
                          <span className="badge badge-info">
                            <Clock size={12} />
                            <span>{safeString(t.statusCode, "V řešení")}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={currentTotal}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Robust Job Detail Modal */}
        {selectedJob && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedJob(null);
            }}
          >
            <div className="modal-dialog animate-fade-in" style={{ maxWidth: "560px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-amber)",
                  }}>
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                      {safeString(selectedJob.name, "Detail zakázky")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Číslo zakázky: {safeString(selectedJob.number, `#${selectedJob.id}`)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      const j = selectedJob;
                      setSelectedJob(null);
                      setEditingJob(j);
                      setIsJobFormOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", gap: "0.35rem" }}
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => setSelectedJob(null)}
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
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Zadavatel / Klient:</div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem" }}>
                      {safeString(selectedJob.customer?.name, "Interní režie")}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Zahájení:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {safeDate(selectedJob.startDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Termín dokončení:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {safeDate(selectedJob.endDate)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Stav zakázky:</div>
                    <div style={{ marginTop: "0.2rem" }}>
                      <span className="badge badge-paid">
                        {safeString(selectedJob.statusCode, "V řešení")}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedJob.note && typeof selectedJob.note === "string" && selectedJob.note.trim() && (
                  <div style={{
                    padding: "0.85rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}>
                    Poznámka: {selectedJob.note}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="btn btn-secondary"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Robust Task Detail Modal */}
        {selectedTask && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTask(null);
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
                    <CheckSquare size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                      {safeString(selectedTask.name, "Detail úkolu")}
                    </h2>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Číslo: {safeString(selectedTask.number, `#${selectedTask.id}`)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      const t = selectedTask;
                      setSelectedTask(null);
                      setEditingTask(t);
                      setIsTaskFormOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", gap: "0.35rem" }}
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
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
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Odpovědná osoba:</div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.2rem" }}>
                      {safeString(selectedTask.assignedTo, "Nepřiřazeno")}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Plánovaný čas:</div>
                      <div style={{ fontWeight: 500, marginTop: "0.2rem" }}>
                        {selectedTask.plannedHours != null ? `${safeNumber(selectedTask.plannedHours)} h` : "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Skutečně odpracováno:</div>
                      <div style={{ fontWeight: 700, color: "var(--brand-primary)", marginTop: "0.2rem" }}>
                        {selectedTask.spentHours != null ? `${safeNumber(selectedTask.spentHours)} h` : "—"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Stav úkolu:</div>
                    <div style={{ marginTop: "0.2rem" }}>
                      <span className="badge badge-info">
                        {safeString(selectedTask.statusCode, "V řešení")}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="btn btn-secondary"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modals */}
        {isJobFormOpen && (
          <JobFormModal
            isOpen={isJobFormOpen}
            onClose={() => {
              setIsJobFormOpen(false);
              setEditingJob(null);
            }}
            customers={customers}
            initialData={editingJob}
            onSave={(saved) => {
              if (onSaveJob) onSaveJob(saved);
              setIsJobFormOpen(false);
              setEditingJob(null);
            }}
          />
        )}

        {isTaskFormOpen && (
          <TaskFormModal
            isOpen={isTaskFormOpen}
            onClose={() => {
              setIsTaskFormOpen(false);
              setEditingTask(null);
            }}
            jobOrders={jobOrders}
            initialData={editingTask}
            onSave={(saved) => {
              if (onSaveTask) onSaveTask(saved);
              setIsTaskFormOpen(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
