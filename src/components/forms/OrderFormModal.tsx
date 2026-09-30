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
  AlertCircle,
  CornerUpLeft,
  Building
} from "lucide-react";
import { Order, OrderItem, Customer, Product } from "@/types/helios";
import { safeCurrency, safeNumber } from "@/lib/table-utils";
import { ProductPickerModal } from "./ProductPickerModal";
import { useEscapeKey } from "@/lib/useEscapeKey";

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
  useEscapeKey(onClose, isOpen);

  const activeInitial = initialOrder || initialData;
  const isEdit = Boolean(activeInitial);

  const [subType, setSubType] = useState<"received" | "issued">(defaultSubType);
  const [orderNumber, setOrderNumber] = useState(
    activeInitial?.orderNumber || activeInitial?.number || `OBJ${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    activeInitial?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    activeInitial?.customer?.name || activeInitial?.customerName || ""
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [orderDate, setOrderDate] = useState(
    activeInitial?.orderDate ? activeInitial.orderDate.split("T")[0] : todayStr
  );
  const [deliveryDate, setDeliveryDate] = useState(
    activeInitial?.deliveryDate ? activeInitial.deliveryDate.split("T")[0] : in7Days
  );

  const [status, setStatus] = useState(activeInitial?.status || "V řešení");
  const [currency, setCurrency] = useState(activeInitial?.currency || "CZK");
  const [note, setNote] = useState(activeInitial?.note || "");

  // Order Items
  const [items, setItems] = useState<OrderItem[]>(
    activeInitial?.items && activeInitial.items.length > 0 ? activeInitial.items : []
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
      totalPrice: Number(prod.price || prod.unitPrice || 0) * 1,
    };

    if (pickerTargetRow === "new") {
      setItems((prev) => [
        ...prev,
        {
          id: Math.floor(Math.random() * 90000) + 10000,
          quantity: 1,
          ...itemData,
        } as OrderItem,
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
    setIsProductPickerOpen(false);
  };

  // Autocomplete support in text input
  const handleItemNameChange = (index: number, val: string) => {
    const matchedProduct = products.find(
      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
    );

    if (matchedProduct) {
      handleUpdateItem(index, "name", matchedProduct.name);
      handleUpdateItem(index, "productId", matchedProduct.id);
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

  const handleAddItem = (prod?: Product) => {
    const newItem: OrderItem = {
      id: Math.floor(Math.random() * 90000) + 10000,
      productId: prod?.id,
      name: prod?.name || "",
      quantity: 1,
      measureUnit: prod?.measureUnit || "ks",
      unitPrice: prod?.price || prod?.unitPrice || 0,
      totalPrice: prod?.price || prod?.unitPrice || 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, val: any) => {
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
  };

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))), 0);

  const handleSubmit = async (e?: React.FormEvent, closeAfter = true) => {
    if (e) e.preventDefault();
    if (items.length === 0) {
      setErrorMessage("Objednávka musí obsahovat alespoň jednu položku.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || "Nezadaný partner";
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payload: Order = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      number: orderNumber,
      orderNumber: orderNumber,
      orderDate: new Date(orderDate).toISOString(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      status: status,
      totalAmount: grandTotal,
      currency: currency,
      note: note,
      customer: {
        id: partnerId,
        name: partnerName,
      },
      customerName: partnerName,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        measureUnit: i.measureUnit,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
    };

    try {
      const endpoint = subType === "received" ? "v1/orders/ordersReceived" : "v1/orders/ordersIssued";
      const url = isEdit ? `/api/helios/${endpoint}/${payload.id}` : `/api/helios/${endpoint}`;
      
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn("Helios API non-OK, updating local state:", res.status);
      }

      onSave(payload);
      if (closeAfter) {
        onClose();
      }
    } catch (err) {
      console.warn("API request failed, fallback to local state:", err);
      onSave(payload);
      if (closeAfter) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          <span className="link">Obchod</span>
          <span className="separator">/</span>
          <span className="link">{subType === "received" ? "Objednávky přijaté" : "Objednávky vydané"}</span>
          <span className="separator">/</span>
          <span className="current">{orderNumber}:</span>
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
              title="Uložit objednávku"
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
            Doklad: <strong style={{ color: "#0284c7" }}>{orderNumber}</strong> ({subType === "received" ? "Objednávka přijatá" : "Objednávka vydaná"})
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

        {/* Unified Form - Header and Items on the same page */}
        <form onSubmit={(e) => handleSubmit(e, true)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* SECTION 1: HLAVIČKA OBJEDNÁVKY */}
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
              <ShoppingCart size={15} />
              <span>Hlavička objednávky</span>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Typ objednávky</label>
                <select
                  className="input-control"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as "received" | "issued")}
                >
                  <option value="received">Přijatá (od zákazníka)</option>
                  <option value="issued">Vydaná (dodavateli)</option>
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
                />
              </div>

              <div>
                <label className="label-control">Stav zpracování</label>
                <select
                  className="input-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="V řešení">V řešení</option>
                  <option value="Potvrzeno">Potvrzeno</option>
                  <option value="Vyřízeno">Vyřízeno</option>
                  <option value="Zrušeno">Zrušeno</option>
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Výběr partnera z adresáře</label>
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
                <label className="label-control">Název partnera *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Zadejte název partnera..."
                />
              </div>

              <div>
                <label className="label-control">Měna dokladu</label>
                <select
                  className="input-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="CZK">CZK - Česká koruna</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dolar</option>
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label-control">Datum objednání</label>
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
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Celková hodnota dokladu</label>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0284c7", padding: "0.4rem 0" }}>
                  {safeCurrency(grandTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: POLOŽKY OBJEDNÁVKY */}
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
                <span>Položky objednávky ({items.length})</span>
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
                  <span>Vybrat ze skladu / ceníku...</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="asol-btn"
                >
                  <Plus size={14} />
                  <span>Přidat volný řádek</span>
                </button>
              </div>
            </div>

            <datalist id="order-products-datalist">
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
                    <th style={{ width: "120px" }}>Kód položky</th>
                    <th>Zboží / Popis položky</th>
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
                        Objednávka zatím neobsahuje žádné položky. Klikněte na <strong>Vybrat ze skladu / ceníku</strong> nebo <strong>Přidat volný řádek</strong>.
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
                            {item.productId ? `FN${String(item.productId).padStart(5, "0")}` : "—"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                              <input
                                type="text"
                                required
                                list="order-products-datalist"
                                className="input-control"
                                style={{ padding: "0.3rem 0.5rem", fontSize: "0.825rem", flex: 1 }}
                                value={item.name || ""}
                                placeholder="Vyberte nebo zadejte položku..."
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
                                title="Vybrat produkt ze skladu / ceníku..."
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
                              value={item.measureUnit || "ks"}
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
              justifyContent: "flex-end",
              alignItems: "center",
            }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Celková hodnota položek: </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0284c7", marginLeft: "0.5rem" }}>
                  {safeCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: POZNÁMKA A SPECIFIKACE */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
          }}>
            <label className="label-control">Poznámka k objednávce / dodací podmínky</label>
            <textarea
              className="input-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Doplňující specifikace, dodací podmínky, interní instrukce..."
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
              WebNephrite • Objednávky Helios Nephrite
            </div>
          </div>
        </form>

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
