export type SortDirection = "asc" | "desc";

export function safeString(val: unknown, fallback = "—"): string {
  if (val == null) return fallback;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.name && typeof obj.name === "string") return obj.name;
    if (obj.number && typeof obj.number === "string") return obj.number;
    if (obj.value && typeof obj.value === "string") return obj.value;
    return fallback;
  }
  return fallback;
}

export function safeNumber(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

export function safeCurrency(val: unknown): string {
  const num = safeNumber(val, 0);
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 2,
  }).format(num);
}

export function safeDate(val: unknown, fallback = "—"): string {
  if (!val || typeof val !== "string") return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("cs-CZ");
  } catch {
    return fallback;
  }
}

// Deep get property helper (e.g. "customer.name" or "totalAmount")
export function getNestedValue(obj: any, path: string): any {
  if (!obj) return null;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return null;
    current = current[part];
  }
  return current;
}

// Generic comparator for tables
export function sortData<T>(
  data: T[],
  sortKey: string | null,
  sortDirection: SortDirection
): T[] {
  if (!sortKey) return data;

  return [...data].sort((a, b) => {
    const valA = getNestedValue(a, sortKey);
    const valB = getNestedValue(b, sortKey);

    if (valA == null && valB == null) return 0;
    if (valA == null) return sortDirection === "asc" ? 1 : -1;
    if (valB == null) return sortDirection === "asc" ? -1 : 1;

    // Number comparison
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    // Number strings comparison (e.g. amounts)
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB) && typeof valA !== "string" && typeof valB !== "string") {
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    // String comparison with Czech locale collation
    const strA = safeString(valA, "");
    const strB = safeString(valB, "");
    const cmp = strA.localeCompare(strB, "cs", { sensitivity: "base", numeric: true });
    return sortDirection === "asc" ? cmp : -cmp;
  });
}
