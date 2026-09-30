"use client";

import { useState } from "react";
import { JobOrder, JobTask, Customer } from "@/types/helios";
import { Search, Briefcase, CheckSquare, Clock, Eye, X, User, Plus, Edit3, ChevronDown, Download } from "lucide-react";
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
  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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

  const activeSelectedJob = jobOrders.find(j => j.id === selectedRowId) || null;
  const activeSelectedTask = tasks.find(t => t.id === selectedRowId) || null;

  const handleEditSelected = () => {
    if (subType === "jobs" && activeSelectedJob) {
      setEditingJob(activeSelectedJob);
      setIsJobFormOpen(true);
    } else if (subType === "tasks" && activeSelectedTask) {
      setEditingTask(activeSelectedTask);
      setIsTaskFormOpen(true);
    }
  };

  const handleExportCsv = () => {
    if (subType === "jobs") {
      const headers = "Cislo;Nazev;Klient;Zahajeni;Ukonceni;Stav\n";
      const rows = filteredJobs.map(j => 
        `"${j.number || j.id}";"${j.name || ''}";"${j.customer?.name || ''}";"${safeDate(j.startDate)}";"${safeDate(j.endDate)}";"${j.statusCode || ''}"`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `zakazky_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = "Cislo;Nazev;Prirazeno;Planovane;Vykonane;Stav\n";
      const rows = filteredTasks.map(t => 
        `"${t.number || t.id}";"${t.name || ''}";"${t.assignedTo || ''}";"${t.plannedHours || 0}";"${t.spentHours || 0}";"${t.statusCode || ''}"`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ukoly_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowActionsMenu(false);
  };

  return (
    <ErrorBoundary fallbackTitle="Chyba při zobrazení zakázek a úkolů">
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* ASOL Breadcrumbs matching Screenshot 2 */}
        <div className="asol-breadcrumb">
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Realizace</span>
          <span className="separator">/</span>
          <span className="current">{subType === "jobs" ? "Zakázky" : "Úkoly a plnění"}</span>
        </div>

        {/* ASOL Action Bar above Table matching Screenshot 2 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          background: "#ffffff",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}>
          {/* Left Action Buttons: [+] [✎] [Akce ▾] + Type switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (subType === "jobs") {
                  setEditingJob(null);
                  setIsJobFormOpen(true);
                } else {
                  setEditingTask(null);
                  setIsTaskFormOpen(true);
                }
              }}
              title={subType === "jobs" ? "Nová zakázka (+)" : "Nový úkol (+)"}
              className="asol-btn asol-btn-icon"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={handleEditSelected}
              disabled={subType === "jobs" ? !activeSelectedJob : !activeSelectedTask}
              title="Upravit vybraný záznam"
              className="asol-btn asol-btn-icon"
            >
              <Edit3 size={16} />
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowActionsMenu(prev => !prev)}
                className="asol-btn"
                style={{ gap: "0.35rem" }}
              >
                <span>Akce</span>
                <ChevronDown size={14} />
              </button>

              {showActionsMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 20,
                  minWidth: "180px",
                  padding: "0.35rem 0",
                }}>
                  <button
                    onClick={handleExportCsv}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.5rem 1rem",
                      fontSize: "0.825rem",
                      color: "#334155",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Download size={14} />
                    <span>Export do CSV</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ width: "1px", height: "24px", background: "#cbd5e1", margin: "0 0.25rem" }} />

            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                onClick={() => { setSubType("jobs"); setSortKey("number"); setCurrentPage(1); }}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: subType === "jobs" ? 700 : 500,
                  borderRadius: "5px",
                  background: subType === "jobs" ? "#e0f2fe" : "transparent",
                  color: subType === "jobs" ? "#0284c7" : "#64748b",
                  border: subType === "jobs" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Zakázky ({jobOrders.length})
              </button>
              <button
                onClick={() => { setSubType("tasks"); setSortKey("number"); setCurrentPage(1); }}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: subType === "tasks" ? 700 : 500,
                  borderRadius: "5px",
                  background: subType === "tasks" ? "#e0f2fe" : "transparent",
                  color: subType === "tasks" ? "#0284c7" : "#64748b",
                  border: subType === "tasks" ? "1px solid #bae6fd" : "1px solid transparent",
                }}
              >
                Úkoly & Realizace ({tasks.length})
              </button>
            </div>
          </div>

          {/* Search input */}
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: "2rem", paddingRight: "1.75rem", fontSize: "0.825rem", height: "34px" }}
              placeholder={subType === "jobs" ? "Hledat zakázku..." : "Hledat úkol..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Main Table Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            {subType === "jobs" ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <SortableHeader
                      label="Číslo zakázky"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "150px" }}
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
                      style={{ width: "120px" }}
                    />
                    <SortableHeader
                      label="Termín ukončení"
                      columnKey="endDate"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "120px" }}
                    />
                    <SortableHeader
                      label="Stav"
                      columnKey="statusCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "120px", textAlign: "center" }}
                    />
                    <th style={{ width: "90px", textAlign: "center" }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        Načítám zakázky z Heliosu...
                      </td>
                    </tr>
                  ) : sortedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        Žádné zakázky k zobrazení.
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((j) => {
                      const isSelected = selectedRowId === j.id;
                      return (
                        <tr 
                          key={j.id}
                          className={isSelected ? "row-selected" : ""}
                          onClick={() => setSelectedRowId(j.id)}
                          onDoubleClick={() => {
                            setEditingJob(j);
                            setIsJobFormOpen(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                            {safeString(j.number, `#${j.id}`)}
                          </td>
                          <td style={{ fontWeight: 600 }}>{safeString(j.name)}</td>
                          <td>{safeString(j.customer?.name, "Interní")}</td>
                          <td>{safeDate(j.startDate)}</td>
                          <td>{safeDate(j.endDate)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="badge badge-paid">
                              {safeString(j.statusCode, "V řešení")}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(j);
                              }}
                              className="asol-btn"
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                background: isSelected ? "rgba(255,255,255,0.2)" : "#ffffff",
                                borderColor: isSelected ? "rgba(255,255,255,0.5)" : "#cbd5e1",
                                color: isSelected ? "#ffffff" : "#0284c7",
                              }}
                              title="Zobrazit detail zakázky"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <SortableHeader
                      label="Číslo úkolu"
                      columnKey="number"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "140px" }}
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
                      style={{ width: "120px", textAlign: "right" }}
                    />
                    <SortableHeader
                      label="Vykázáno hod."
                      columnKey="spentHours"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "120px", textAlign: "right" }}
                    />
                    <SortableHeader
                      label="Stav"
                      columnKey="statusCode"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: "120px", textAlign: "center" }}
                    />
                    <th style={{ width: "90px", textAlign: "center" }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        Načítám úkoly...
                      </td>
                    </tr>
                  ) : sortedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                        Žádné úkoly k zobrazení.
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((t) => {
                      const isSelected = selectedRowId === t.id;
                      return (
                        <tr 
                          key={t.id}
                          className={isSelected ? "row-selected" : ""}
                          onClick={() => setSelectedRowId(t.id)}
                          onDoubleClick={() => {
                            setEditingTask(t);
                            setIsTaskFormOpen(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{safeString(t.number, `#${t.id}`)}</td>
                          <td style={{ fontWeight: 600 }}>{safeString(t.name)}</td>
                          <td>{safeString(t.assignedTo, "Nepřiřazeno")}</td>
                          <td style={{ textAlign: "right" }}>{t.plannedHours != null ? `${safeNumber(t.plannedHours)} h` : "—"}</td>
                          <td style={{ textAlign: "right", fontWeight: 600, color: "#0284c7" }}>
                            {t.spentHours != null ? `${safeNumber(t.spentHours)} h` : "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="badge badge-info">
                              {safeString(t.statusCode, "V řešení")}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(t);
                              }}
                              className="asol-btn"
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                background: isSelected ? "rgba(255,255,255,0.2)" : "#ffffff",
                                borderColor: isSelected ? "rgba(255,255,255,0.5)" : "#cbd5e1",
                                color: isSelected ? "#ffffff" : "#0284c7",
                              }}
                              title="Zobrazit detail úkolu"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Bar */}
          <div style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.825rem",
          }}>
            <div>
              <span style={{ color: "#64748b" }}>Zobrazeno záznamů: </span>
              <strong style={{ color: "#1e293b" }}>{currentTotal}</strong>
            </div>

            {currentTotal > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalItems={currentTotal}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </div>

        {/* Modal: Job Detail */}
        {selectedJob && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedJob(null);
            }}
          >
            <div 
              className="modal-dialog animate-fade-in" 
              style={{ maxWidth: "700px", padding: "1.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div className="asol-breadcrumb" style={{ margin: 0, padding: 0, background: "transparent", border: "none" }}>
                    <span>Zakázky</span>
                    <span className="separator">/</span>
                    <span className="current">{selectedJob.number || selectedJob.id}</span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginTop: "0.25rem" }}>
                    {selectedJob.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Zadavatel / Klient:</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginTop: "0.2rem" }}>
                    {safeString(selectedJob.customer?.name, "Interní režie")}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.825rem" }}>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Datum zahájení</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>{safeDate(selectedJob.startDate)}</div>
                  </div>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Datum ukončení</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>{safeDate(selectedJob.endDate)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setEditingJob(selectedJob);
                      setSelectedJob(null);
                      setIsJobFormOpen(true);
                    }}
                    className="asol-btn"
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="asol-btn"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Task Detail */}
        {selectedTask && (
          <div 
            className="modal-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTask(null);
            }}
          >
            <div 
              className="modal-dialog animate-fade-in" 
              style={{ maxWidth: "680px", padding: "1.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div className="asol-breadcrumb" style={{ margin: 0, padding: 0, background: "transparent", border: "none" }}>
                    <span>Úkoly</span>
                    <span className="separator">/</span>
                    <span className="current">{selectedTask.number || selectedTask.id}</span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginTop: "0.25rem" }}>
                    {selectedTask.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Řešitel / Odpovědná osoba</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginTop: "0.2rem" }}>
                    {safeString(selectedTask.assignedTo, "Nepřiřazeno")}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.825rem" }}>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Plánovaný čas</div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>
                      {selectedTask.plannedHours != null ? `${selectedTask.plannedHours} hod.` : "Nespecifikováno"}
                    </div>
                  </div>
                  <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "0.725rem" }}>Vykázaný čas</div>
                    <div style={{ fontWeight: 600, color: "#0284c7", marginTop: "0.2rem" }}>
                      {selectedTask.spentHours != null ? `${selectedTask.spentHours} hod.` : "0 hod."}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setSelectedTask(null);
                      setIsTaskFormOpen(true);
                    }}
                    className="asol-btn"
                  >
                    <Edit3 size={14} />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="asol-btn"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modals */}
        <JobFormModal
          isOpen={isJobFormOpen}
          onClose={() => setIsJobFormOpen(false)}
          onSave={(saved) => {
            onSaveJob?.(saved);
            setIsJobFormOpen(false);
          }}
          initialJob={editingJob}
          customers={customers}
        />

        <TaskFormModal
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSave={(saved) => {
            onSaveTask?.(saved);
            setIsTaskFormOpen(false);
          }}
          initialTask={editingTask}
          jobOrders={jobOrders}
        />
      </div>
    </ErrorBoundary>
  );
}
