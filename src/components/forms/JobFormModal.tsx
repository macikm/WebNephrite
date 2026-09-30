"use client";

import { useState } from "react";
import { 
  X, 
  Briefcase, 
  Save, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Trash2, 
  Package, 
  CornerUpLeft,
  Building
} from "lucide-react";
import { JobOrder, JobOrderItem, Customer, Product } from "@/types/helios";
import { safeCurrency, safeNumber } from "@/lib/table-utils";
import { ProductPickerModal } from "./ProductPickerModal";
import { useEscapeKey } from "@/lib/useEscapeKey";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobOrder) => void;
  initialJob?: JobOrder | null;
  initialData?: JobOrder | null;
  customers?: Customer[];
  products?: Product[];
}

export function JobFormModal({
  isOpen,
  onClose,
  onSave,
  initialJob,
  initialData,
  customers = [],
  products = [],
}: JobFormModalProps) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const activeInitial = initialJob || initialData;
  const isEdit = Boolean(activeInitial);

  const [number, setNumber] = useState(
    activeInitial?.number || `ZAK${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [name, setName] = useState(activeInitial?.name || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    activeInitial?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    activeInitial?.customer?.name || ""
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    activeInitial?.startDate ? activeInitial.startDate.split("T")[0] : todayStr
  );
  const [endDate, setEndDate] = useState(
    activeInitial?.endDate ? activeInitial.endDate.split("T")[0] : in30Days
  );

  const [statusCode, setStatusCode] = useState(activeInitial?.statusCode || "V řešení");
  const [note, setNote] = useState(activeInitial?.note || "");

  // Line items of the job order (Helios položková třída zakázky)
  const [items, setItems] = useState<JobOrderItem[]>(
    activeInitial?.items && activeInitial.items.length > 0 ? activeInitial.items : []
  );

  const [manualBudget, setManualBudget] = useState<number | null>(
    activeInitial?.budget != null && (!activeInitial.items || activeInitial.items.length === 0)
      ? activeInitial.budget
      : null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Product Picker Modal state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerTargetRow, setPickerTargetRow] = useState<number | "new">("new");

  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))), 0);
  const computedBudget = manualBudget !== null ? manualBudget : itemsTotal;

  const handleCustomerSelect = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId("");
      return;
    }
    const id = Number(idStr);
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomCustomerName(found.name);
    }
  };

  const handleAddItem = (prod?: Product) => {
    const newItem: JobOrderItem = {
      id: Math.floor(Math.random() * 90000) + 10000,
      productId: prod?.id,
      code: prod?.referenceId || (prod?.id ? `FN${String(prod.id).padStart(5, "0")}` : undefined),
      name: prod?.name || "",
      quantity: 1,
      measureUnit: prod?.measureUnit || "hod",
      unitPrice: prod?.price || prod?.unitPrice || 0,
      totalPrice: prod?.price || prod?.unitPrice || 0,
    };
    setItems((prev) => [...prev, newItem]);
    setManualBudget(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof JobOrderItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(val) : Number(item.quantity || 1);
        const price = field === "unitPrice" ? Number(val) : Number(item.unitPrice || 0);
        item.totalPrice = qty * price;
      }
      copy[index] = item;
      return copy;
    });
    setManualBudget(null);
  };

  const handleItemNameChange = (index: number, val: string) => {
    const matchedProduct = products.find(
      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
    );

    if (matchedProduct) {
      handleUpdateItem(index, "name", matchedProduct.name);
      handleUpdateItem(index, "productId", matchedProduct.id);
      handleUpdateItem(index, "code", matchedProduct.referenceId || `FN${String(matchedProduct.id).padStart(5, "0")}`);
      if (matchedProduct.price || matchedProduct.unitPrice) {
        const price = Number(matchedProduct.price || matchedProduct.unitPrice);
        handleUpdateItem(index, "unitPrice", price);
        const currentQty = items[index]?.quantity || 1;
        handleUpdateItem(index, "totalPrice", price * currentQty);
      }
      if (matchedProduct.measureUnit) {
        handleUpdateItem(index, "measureUnit", matchedProduct.measureUnit);
      }
    } else {
      handleUpdateItem(index, "name", val);
    }
  };

  const handleProductPicked = (prod: Product) => {
    const itemData: Partial<JobOrderItem> = {
      productId: prod.id,
      code: prod.referenceId || `FN${String(prod.id).padStart(5, "0")}`,
      name: prod.name,
      measureUnit: prod.measureUnit || "hod",
      unitPrice: prod.price || prod.unitPrice || 0,
      totalPrice: Number(prod.price || prod.unitPrice || 0) * 1,
    };

    if (pickerTargetRow === "new") {
      setItems((prev) => [
        ...prev,
        {
          id: Math.floor(Math.random() * 90000) + 10000,
          quantity: 1,
          ...itemData,
        } as JobOrderItem,
      ]);
    } else {
      setItems((prev) => {
        const copy = [...prev];
        if (copy[pickerTargetRow]) {
          const currentQty = copy[pickerTargetRow].quantity || 1;
          copy[pickerTargetRow] = {
            ...copy[pickerTargetRow],
            ...itemData,
            quantity: currentQty,
            totalPrice: Number(itemData.unitPrice || 0) * currentQty,
          };
        }
        return copy;
      });
    }
    setManualBudget(null);
    setIsProductPickerOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent, closeAfter = true) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vyplňte prosím název zakázky.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || undefined;
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payloadJob: JobOrder = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      number: number.trim(),
      name: name.trim(),
      customer: partnerName ? { id: partnerId, name: partnerName } : undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      budget: computedBudget,
      statusCode,
      note: note.trim() || undefined,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        code: i.code,
        name: i.name,
        quantity: i.quantity,
        measureUnit: i.measureUnit,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        note: i.note,
      })),
    };

    try {
      const url = isEdit
        ? `/api/helios/v1/jobOrder/jobOrders/${payloadJob.id}`
        : `/api/helios/v1/jobOrder/jobOrders`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadJob),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK status for job, saving locally:", res.status);
      }

      onSave(payloadJob);
      if (closeAfter) {
        onClose();
      }
    } catch (err: unknown) {
      console.warn("Failed to contact Helios API, saving locally:", err);
      onSave(payloadJob);
      if (closeAfter) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-dialog animate-fade-in" 
        style={{ maxWidth: "1080px", padding: "1.5rem" }}
      >
        {/* Breadcrumbs */}
        <div className="asol-breadcrumb" style={{ margin: "0 0 1rem 0" }}>
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Realizace</span>
          <span className="separator">/</span>
          <span className="link">Zakázky</span>
          <span className="separator">/</span>
          <span className="current">{number}:</span>
        </div>

        {/* Top Action Toolbar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, false)}
              disabled={isSubmitting}
              className="asol-btn-save"
              title="Uložit zakázku"
            >
              <Save size={15} />
              <span>{isSubmitting ? "Ukládám..." : "Uložit"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(undefined, true)}
              disabled={isSubmitting}
              className="asol-btn-save"
              title="Uložit a zavřít"
            >
              <CornerUpLeft size={15} />
              <span>Uložit a zpět</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="asol-btn-back"
              title="Zavřít formulář"
            >
              <X size={15} />
              <span>Zpět</span>
            </button>
          </div>

          <div style={{
            fontSize: "0.8rem",
            color: "#64748b",
            background: "#f1f5f9",
            padding: "0.3rem 0.75rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}>
            Zakázka: <strong style={{ color: "#0284c7" }}>{number}</strong> ({isEdit ? "Editace" : "Nová zakázka"})
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            padding: "0.65rem 1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.85rem",
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unified Form - Header & Line Items on the same page */}
        <form onSubmit={(e) => handleSubmit(e, true)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* SECTION 1: HLAVIČKA ZAKÁZKY */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#0284c7", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Briefcase size={15} />
              <span>Hlavička zakázky</span>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Číslo zakázky *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="label-control">Název zakázky *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  placeholder="např. Rekonstrukce serverovny, Dodávka ERP licencí..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Výběr zákazníka z adresáře</label>
                <select
                  className="input-control"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">— Vyberte partnera ze systému —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-control">Název zákazníka</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Zadejte název klienta..."
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Stav zakázky</label>
                <select
                  className="input-control"
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                >
                  <option value="V řešení">V řešení</option>
                  <option value="Schváleno">Schváleno</option>
                  <option value="V realizaci">V realizaci</option>
                  <option value="Pozastaveno">Pozastaveno</option>
                  <option value="Dokončeno">Dokončeno</option>
                  <option value="Zrušeno">Zrušeno</option>
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Termín zahájení</label>
                <input
                  type="date"
                  className="input-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Termín ukončení / předání</label>
                <input
                  type="date"
                  className="input-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Celkový rozpočet zakázky (CZK)</label>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0284c7", padding: "0.4rem 0" }}>
                  {safeCurrency(computedBudget)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: POLOŽKY ZAKÁZKY (Helios položková třída zakázky) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#0284c7", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Package size={15} />
                <span>Položky a plánované činnosti zakázky ({items.length})</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPickerTargetRow("new");
                    setIsProductPickerOpen(true);
                  }}
                  className="asol-btn"
                  style={{ color: "#0284c7", borderColor: "#bae6fd", background: "#f0f9ff" }}
                >
                  <Package size={14} />
                  <span>Vybrat z katalogu / ceníku...</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="asol-btn"
                >
                  <Plus size={14} />
                  <span>Přidat položku zakázky</span>
                </button>
              </div>
            </div>

            <datalist id="job-products-datalist">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.referenceId ? `[${p.referenceId}] ` : ""}{p.price ? `${safeCurrency(p.price)}` : ""}
                </option>
              ))}
            </datalist>

            <div className="table-wrapper" style={{ maxHeight: "360px", overflowY: "auto" }}>
              <table className="erp-table" style={{ minWidth: "850px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>ř.</th>
                    <th style={{ width: "120px" }}>Kód</th>
                    <th>Položka / Služba / Činnost</th>
                    <th style={{ width: "90px" }}>Množství</th>
                    <th style={{ width: "70px" }}>MJ</th>
                    <th style={{ width: "140px", textAlign: "right" }}>Cena / MJ</th>
                    <th style={{ width: "140px", textAlign: "right" }}>Celkem</th>
                    <th style={{ width: "45px", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2rem 1rem", color: "#64748b" }}>
                        Zakázka zatím nemá definované položky. Přidejte řádky kliknutím na <strong>Vybrat z katalogu / ceníku</strong> nebo <strong>Přidat položku zakázky</strong>.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const lineTotal = Number(item.totalPrice) || (Number(item.quantity || 1) * Number(item.unitPrice || 0));
                      return (
                        <tr key={item.id || idx}>
                          <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                            {item.code || (item.productId ? `FN${String(item.productId).padStart(5, "0")}` : "—")}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="text"
                                required
                                list="job-products-datalist"
                                className="input-control"
                                style={{ padding: "0.3rem 0.5rem", fontSize: "0.825rem", flex: 1 }}
                                value={item.name || ""}
                                placeholder="Vyberte nebo zadejte položku / činnost..."
                                onChange={(e) => handleItemNameChange(idx, e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPickerTargetRow(idx);
                                  setIsProductPickerOpen(true);
                                }}
                                className="asol-btn asol-btn-icon"
                                style={{ width: "26px", height: "26px", fontSize: "0.75rem", flexShrink: 0 }}
                                title="Vybrat z katalogu / ceníku..."
                              >
                                ...
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              className="input-control"
                              style={{ padding: "0.3rem 0.4rem", fontSize: "0.825rem", textAlign: "right" }}
                              value={item.quantity ?? 1}
                              onChange={(e) => handleUpdateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input-control"
                              style={{ padding: "0.3rem 0.4rem", fontSize: "0.825rem", textAlign: "center" }}
                              value={item.measureUnit || "hod"}
                              onChange={(e) => handleUpdateItem(idx, "measureUnit", e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              step="any"
                              className="input-control"
                              style={{ padding: "0.3rem 0.4rem", fontSize: "0.825rem", textAlign: "right" }}
                              value={item.unitPrice ?? 0}
                              onChange={(e) => handleUpdateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#0284c7" }}>
                            {safeCurrency(lineTotal)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="asol-btn asol-btn-icon"
                              style={{ width: "26px", height: "26px", color: "#dc2626" }}
                              title="Smazat řádek"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "0.85rem 1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Součet položek zakázky: <strong>{items.length} pol.</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Celkový rozpočet položek: </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0284c7", marginLeft: "0.5rem" }}>
                  {safeCurrency(itemsTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: POZNÁMKA K ZAKÁZCE */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
          }}>
            <label className="label-control">Poznámka k realizaci zakázky</label>
            <textarea
              className="input-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Interní poznámka k zakázce, harmonogram, předávací podmínky..."
            />
          </div>

          {/* Bottom Actions Bar */}
          <div style={{
            marginTop: "0.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => handleSubmit(undefined, false)}
                disabled={isSubmitting}
                className="asol-btn-save"
              >
                <Save size={15} />
                <span>{isSubmitting ? "Ukládám..." : "Uložit"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={isSubmitting}
                className="asol-btn-save"
              >
                <CornerUpLeft size={15} />
                <span>Uložit a zpět</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="asol-btn-back"
              >
                <X size={15} />
                <span>Zpět</span>
              </button>
            </div>

            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              WebNephrite • Zakázky Helios Nephrite
            </div>
          </div>
        </form>

        <ProductPickerModal
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          onSelectProduct={handleProductPicked}
          products={products}
        />
      </div>
    </div>
  );
}
