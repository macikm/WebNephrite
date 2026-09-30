"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { SortDirection } from "@/lib/table-utils";

interface SortableHeaderProps {
  label: string;
  columnKey: string;
  currentSortKey: string | null;
  sortDirection: SortDirection;
  onSort: (columnKey: string) => void;
  style?: React.CSSProperties;
}

export function SortableHeader({
  label,
  columnKey,
  currentSortKey,
  sortDirection,
  onSort,
  style,
}: SortableHeaderProps) {
  const isSorted = currentSortKey === columnKey;

  return (
    <th
      onClick={() => onSort(columnKey)}
      style={{
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.12s ease",
        color: isSorted ? "#0284c7" : "#334155",
        background: isSorted ? "#f0f9ff" : undefined,
        whiteSpace: "nowrap",
        ...style,
      }}
      title={`Klikněte pro řazení / filtr podle: ${label}`}
    >
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "0.5rem" }}>
        <span>{label}</span>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {isSorted ? (
            sortDirection === "asc" ? (
              <ArrowUp size={12} style={{ color: "#0284c7" }} />
            ) : (
              <ArrowDown size={12} style={{ color: "#0284c7" }} />
            )
          ) : (
            <span style={{ fontSize: "0.65rem", color: "#64748b", opacity: 0.65 }}>▼</span>
          )}
        </span>
      </div>
    </th>
  );
}
