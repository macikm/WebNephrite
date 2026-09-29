"use client";

import { useState } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Save, 
  AlertCircle 
} from "lucide-react";
import { Order, OrderItem, Customer, Product } from "@/types/helios";
import { safeCurrency, safeNumber } from "@/lib/table-utils";
import { ProductPickerModal } from "./ProductPickerModal";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  initialOrder?: Order | null;
  initialData?: Order | null;
  defaultSubType?: "received" | "issued";
  customers: Customer[];
  products: Product[];
}

export function OrderFormModal({
  isOpen,
  onClose,
  onSave,
  initialOrder,
  initialData,
  defaultSubType = "received",
  customers,
  products,
}: OrderFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialOrder || initialData;
  const isEdit = Boolean(activeInitial);

  const [subType, setSubType] = useState<"received" | "issued">(defaultSubType);
  const [orderNumber, setOrderNumber] = useState(
    initialOrder?.orderNumber || initialOrder?.number || `OBJ${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    initialOrder?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    initialOrder?.customer?.name || initialOrder?.customerName || ""
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [orderDate, setOrderDate] = useState(
    initialOrder?.orderDate ? initialOrder.orderDate.split("T")[0] : todayStr
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialOrder?.deliveryDate ? initialOrder.deliveryDate.split("T")[0] : in7Days
  );

  const [status, setStatus] = useState(initialOrder?.status || "V řešení");
  const [currency, setCurrency] = useState(initialOrder?.currency || "CZK");
  const [note, setNote] = useState(initialOrder?.note || "");

  // Order Items
  const [items, setItems] = useState<OrderItem[]>(
    initialOrder?.items && initialOrder.items.length > 0 ? initialOrder.items : []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Product Picker Modal State
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerTargetRow, setPickerTargetRow] = useState<number | "new">("new");

  const handleSelectProduct = (prod: Product) => {
    const itemData: Partial<OrderItem> = {
      productId: prod.id,
      name: prod.name,
      measureUnit: prod.measureUnit || "ks",
      unitPrice: prod.price || prod.unitPrice || 0,
    };

    if (pickerTargetRow === "new") {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          quantity: 1,
          ...itemData,
        },
      ]);
    } else if (typeof pickerTargetRow === "number") {
      handleUpdateItem(pickerTargetRow, itemData);
    }
  };

  const handleItemNameChange = (idx: number, newName: string) => {
    const matched = products.find(
      (p) => p.name.toLowerCase() === newName.toLowerCase().trim()
    );
    if (matched) {
      handleUpdateItem(idx, {
        productId: matched.id,
        name: matched.name,
        measureUnit: matched.measureUnit || items[idx]?.measureUnit || "ks",
        unitPrice: matched.price || matched.unitPrice || items[idx]?.unitPrice || 0,
      });
    } else {
      handleUpdateItem(idx, { name: newName });
    }
  };

  const handleAddItem = (productId?: number) => {
    if (productId) {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const newItem: OrderItem = {
          id: Date.now(),
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          measureUnit: prod.measureUnit || "ks",
          unitPrice: prod.price || prod.unitPrice || 500,
        };
        setItems((prev) => [...prev, newItem]);
        return;
      }
    }

    const newItem: OrderItem = {
      id: Date.now(),
      name: "",
      quantity: 1,
      measureUnit: "ks",
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedItems = items.map((i) => {
    const qty = safeNumber(i.quantity, 1);
    const price = safeNumber(i.unitPrice, 0);
    return {
      ...i,
      totalPrice: qty * price,
    };
  });

  const grandTotal = calculatedItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setErrorMessage("Zadejte prosím číslo objednávky.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || "Nezadaný partner";
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payloadOrder: Order = {
      id: initialOrder?.id || Math.floor(Math.random() * 90000) + 10000,
      number: orderNumber,
      orderNumber,
      customerName: partnerName,
      customer: {
        id: partnerId,
        name: partnerName,
      },
      orderDate: new Date(orderDate).toISOString(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      status,
      currency,
      totalAmount: grandTotal,
      note,
      items: calculatedItems,
    };

    try {
      const endpoint = subType === "received" ? "v1/warehouse/ordersReceived" : "v1/warehouse/ordersIssued";
      const url = isEdit ? `/api/helios/${endpoint}/${payloadOrder.id}` : `/api/helios/${endpoint}`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadOrder),
      });

      if (!res.ok) {
        console.warn("Helios API returned non-OK status, saving locally:", res.status);
      }

      onSave(payloadOrder);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to reach Helios API directly, updating locally:", err);
      onSave(payloadOrder);
      onClose();
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
        style={{ maxWidth: "880px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--accent-blue), #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.35)",
            }}>
              <ShoppingCart size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava objednávky" : "Nová objednávka"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {subType === "received" ? "Přijatá objednávka od zákazníka" : "Vydaná objednávka dodavateli"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
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
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            color: "#fda4af",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Header section */}
          <div className="form-section">
            <div className="form-grid-3" style={{ marginBottom: "1rem" }}>
              <div>
                <label className="label-control">Typ objednávky</label>
                <select
                  className="input-control"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as "received" | "issued")}
                >
                  <option value="received">Přijatá objednávka (Odběratelská)</option>
                  <option value="issued">Vydaná objednávka (Dodavatelská)</option>
                </select>
              </div>

              <div>
                <label className="label-control">Číslo objednávky *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="např. OBJ2026-001"
                />
              </div>

              <div>
                <label className="label-control">Stav vyřízení</label>
                <select
                  className="input-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Přijato">Přijato</option>
                  <option value="V řešení">V řešení</option>
                  <option value="Vyskladněno">Vyskladněno</option>
                  <option value="Dokončeno">Dokončeno</option>
                  <option value="Stornováno">Stornováno</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label-control">Výběr partnera ze systému</label>
                <select
                  className="input-control"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">— Vyberte partnera ze seznamu —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.tin ? `(IČO: ${c.tin})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-control">Název partnera / zákazníka *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Zadejte název zákazníka..."
                />
              </div>
            </div>
          </div>

          {/* Dates & Currency */}
          <div className="form-section">
            <div className="form-grid-3">
              <div>
                <label className="label-control">Datum objednávky</label>
                <input
                  type="date"
                  className="input-control"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Požadovaný termín dodání</label>
                <input
                  type="date"
                  className="input-control"
                  style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Měna</label>
                <select
                  className="input-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="CZK">CZK (Kč)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Editor */}
          <div className="form-section" style={{ background: "rgba(15, 23, 42, 0.85)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div className="form-section-title" style={{ margin: 0, color: "var(--accent-blue)" }}>
                <Package size={16} />
                <span>Položky objednávky ({items.length})</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPickerTargetRow("new");
                    setIsProductPickerOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", gap: "0.35rem" }}
                  title="Otevřít katalog zboží pro výběr položky"
                >
                  <Package size={14} style={{ color: "var(--accent-cyan)" }} />
                  <span>Vybrat ze skladu / ceníku...</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="btn btn-primary"
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", gap: "0.35rem" }}
                >
                  <Plus size={14} />
                  <span>Přidat volný řádek</span>
                </button>
              </div>
            </div>

            {/* Datalist for order items autocomplete */}
            <datalist id="order-products-datalist">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.referenceId ? `[${p.referenceId}] ` : ""}{p.price ? `${safeCurrency(p.price)}` : ""}
                </option>
              ))}
            </datalist>

            <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="erp-table" style={{ minWidth: "700px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Popis položky</th>
                    <th style={{ width: "15%" }}>Množství</th>
                    <th style={{ width: "12%" }}>Jednotka</th>
                    <th style={{ width: "18%" }}>Cena za jednotku</th>
                    <th style={{ width: "20%" }}>Celkem</th>
                    <th style={{ width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1.5rem", color: "var(--text-dim)" }}>
                        <div style={{ marginBottom: "0.85rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                          Objednávka zatím neobsahuje žádné položky.
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPickerTargetRow("new");
                              setIsProductPickerOpen(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", gap: "0.35rem" }}
                          >
                            <Package size={15} style={{ color: "var(--accent-cyan)" }} />
                            <span>Vybrat ze skladu / ceníku</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddItem()}
                            className="btn btn-primary"
                            style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", gap: "0.35rem" }}
                          >
                            <Plus size={15} />
                            <span>Přidat volný řádek</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    calculatedItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>
                          <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                            <input
                              type="text"
                              required
                              list="order-products-datalist"
                              className="input-control"
                              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", flex: 1 }}
                              value={item.name || ""}
                              placeholder="Položka nebo název ze skladu..."
                              onChange={(e) => handleItemNameChange(idx, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPickerTargetRow(idx);
                                setIsProductPickerOpen(true);
                              }}
                              className="btn btn-secondary"
                              style={{
                                padding: "0.35rem 0.55rem",
                                fontSize: "0.75rem",
                                height: "32px",
                                minWidth: "34px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--brand-primary)",
                                borderColor: "rgba(59, 130, 246, 0.3)",
                                fontWeight: 700,
                              }}
                              title="Vybrat položku ze skladu / ceníku (...)"
                            >
                              ...
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            className="input-control"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", textAlign: "right" }}
                            value={item.quantity ?? 1}
                            onChange={(e) => handleUpdateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-control"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", textAlign: "center" }}
                            value={item.measureUnit || "ks"}
                            onChange={(e) => handleUpdateItem(idx, { measureUnit: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            required
                            className="input-control"
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", textAlign: "right" }}
                            value={item.unitPrice ?? 0}
                            onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {safeCurrency(item.totalPrice, currency)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{
                              color: "var(--accent-rose)",
                              padding: "4px",
                              cursor: "pointer",
                              background: "transparent",
                              border: "none",
                            }}
                            title="Smazat položku"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <div style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1.5rem",
                textAlign: "right",
              }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-blue)", fontWeight: 700 }}>
                  Celková hodnota objednávky
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
                  {safeCurrency(grandTotal, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Poznámka k objednávce</label>
            <textarea
              className="input-control"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Instrukce k dodání, kontaktní místo na stavbě..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ minWidth: "160px" }}
            >
              <Save size={16} />
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit změny" : "Vytvořit objednávku"}</span>
            </button>
          </div>
        </form>

        {/* Product Picker Modal */}
        <ProductPickerModal
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          onSelectProduct={handleSelectProduct}
          products={products}
        />
      </div>
    </div>
  );
}
