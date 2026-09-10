"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate a compact page range (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const delta = 1;
    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift(-1); // ellipsis
    }
    if (currentPage + delta < totalPages - 1) {
      range.push(-2); // ellipsis
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "1.25rem",
      paddingTop: "1rem",
      borderTop: "1px solid var(--border-subtle)",
      fontSize: "0.85rem",
      color: "var(--text-muted)",
      flexWrap: "wrap",
      gap: "1rem",
    }}>
      {/* Items info and Page Size selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div>
          Zobrazeno <strong style={{ color: "var(--text-main)" }}>{startItem}–{endItem}</strong> z <strong style={{ color: "var(--text-main)" }}>{totalItems}</strong> záznamů
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Na stránku:</span>
          <select
            className="input-control"
            style={{ width: "auto", padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page navigation controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="btn btn-secondary"
          style={{ padding: "0.35rem 0.5rem", minWidth: "32px", opacity: currentPage <= 1 ? 0.4 : 1 }}
          title="První stránka"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-secondary"
          style={{ padding: "0.35rem 0.5rem", minWidth: "32px", opacity: currentPage <= 1 ? 0.4 : 1 }}
          title="Předchozí stránka"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, idx) => {
          if (p < 0) {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: "0 0.3rem", color: "var(--text-dim)" }}>
                …
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
              style={{
                padding: "0.35rem 0.65rem",
                minWidth: "32px",
                fontSize: "0.8rem",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary"
          style={{ padding: "0.35rem 0.5rem", minWidth: "32px", opacity: currentPage >= totalPages ? 0.4 : 1 }}
          title="Další stránka"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary"
          style={{ padding: "0.35rem 0.5rem", minWidth: "32px", opacity: currentPage >= totalPages ? 0.4 : 1 }}
          title="Poslední stránka"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
