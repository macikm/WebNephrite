"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
        transition: "color 0.15s ease, background-color 0.15s ease",
        color: isSorted ? "var(--brand-primary)" : "var(--text-muted)",
        whiteSpace: "nowrap",
        ...style,
      }}
      title={`Klikněte pro řazení podle: ${label}`}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        <span>{label}</span>
        {isSorted ? (
          sortDirection === "asc" ? (
            <ArrowUp size={13} style={{ color: "var(--brand-primary)" }} />
          ) : (
            <ArrowDown size={13} style={{ color: "var(--brand-primary)" }} />
          )
        ) : (
          <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
        )}
      </div>
    </th>
  );
}
