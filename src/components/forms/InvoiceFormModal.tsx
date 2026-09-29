"use client";

import { useState } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Building, 
  Calendar, 
  CreditCard, 
  Package, 
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Invoice, InvoiceItem, Customer, Product } from "@/types/helios";
import { safeCurrency, safeNumber } from "@/lib/table-utils";

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
  initialData?: Invoice | null;
  defaultType?: "issued" | "received";
  customers: Customer[];
  products: Product[];
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  initialData,
  defaultType = "issued",
  customers,
  products,
}: InvoiceFormModalProps) {
  if (!isOpen) return null;

  const activeInitial = initialInvoice || initialData;
  const isEdit = Boolean(activeInitial);

  // Form State
  const [docType, setDocType] = useState<"issued" | "received">(
    initialInvoice ? (defaultType) : defaultType
  );
  const [invoiceNo, setInvoiceNo] = useState(
    initialInvoice?.invoiceNo || initialInvoice?.number || `FV${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [variableSymbol, setVariableSymbol] = useState(
    initialInvoice?.variableSymbol || invoiceNo.replace(/\D/g, "") || String(Date.now()).slice(-8)
  );
  const [constantSymbol, setConstantSymbol] = useState(initialInvoice?.constantSymbol || "0308");
  
  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    initialInvoice?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    initialInvoice?.customer?.name || ""
  );
  const [customerTin, setCustomerTin] = useState(initialInvoice?.tin || "");

  // Dates
  const todayStr = new Date().toISOString().split("T")[0];
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate ? initialInvoice.issueDate.split("T")[0] : todayStr
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ? initialInvoice.dueDate.split("T")[0] : in14Days
  );
  const [vatDate, setVatDate] = useState(
    initialInvoice?.vatDate ? initialInvoice.vatDate.split("T")[0] : todayStr
  );

  // Payment & Currency
  const [paymentType, setPaymentType] = useState(initialInvoice?.paymentType || "Převodem");
  const [currencyCode, setCurrencyCode] = useState(initialInvoice?.currencyCode || "CZK");
  const [note, setNote] = useState(initialInvoice?.note || "");

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: 1,
            name: "Konzultační a programátorské práce",
            quantity: 1,
            measureUnit: "hod",
            unitPrice: 1850,
            vatRate: 21,
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When customer dropdown changes
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
      setCustomerTin(found.tin || "");
    }
  };

  // Add Item
  const handleAddItem = (productId?: number) => {
    if (productId) {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const newItem: InvoiceItem = {
          id: Date.now(),
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          measureUnit: prod.measureUnit || "ks",
          unitPrice: prod.price || prod.unitPrice || 1000,
          vatRate: prod.vatRate != null ? prod.vatRate : 21,
        };
        setItems((prev) => [...prev, newItem]);
        return;
      }
    }

    const newItem: InvoiceItem = {
      id: Date.now(),
      name: "",
      quantity: 1,
      measureUnit: "ks",
      unitPrice: 0,
      vatRate: 21,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update Item
  const handleUpdateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Recalculations
  const calculatedItems = items.map((item) => {
    const qty = safeNumber(item.quantity, 1);
    const price = safeNumber(item.unitPrice, 0);
    const rate = safeNumber(item.vatRate, 21);
    const base = qty * price;
    const vat = base * (rate / 100);
    const total = base + vat;
    return {
      ...item,
      base,
      vat,
      total,
    };
  });

  const totalBase = calculatedItems.reduce((sum, i) => sum + i.base, 0);
  const totalVat = calculatedItems.reduce((sum, i) => sum + i.vat, 0);
  const grandTotal = totalBase + totalVat;

  // VAT Recapitulation by rates
  const vatSummary = [21, 12, 0].map((rate) => {
    const itemsInRate = calculatedItems.filter((i) => Math.round(safeNumber(i.vatRate, 0)) === rate);
    const base = itemsInRate.reduce((sum, i) => sum + i.base, 0);
    const vat = itemsInRate.reduce((sum, i) => sum + i.vat, 0);
    return { rate, base, vat, total: base + vat };
  }).filter((v) => v.base > 0 || v.vat > 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim()) {
      setErrorMessage("Vyplňte prosím číslo dokladu.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Faktura musí obsahovat alespoň jednu položku.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || "Nezadaný partner";
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payloadInvoice: Invoice = {
      id: initialInvoice?.id || Math.floor(Math.random() * 90000) + 10000,
      number: invoiceNo,
      invoiceNo: invoiceNo,
      variableSymbol: variableSymbol || invoiceNo.replace(/\D/g, ""),
      constantSymbol,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      vatDate: new Date(vatDate).toISOString(),
      currencyCode,
      paymentType,
      totalAmount: grandTotal,
      outstandingAmount: grandTotal,
      invPaymentStatusCode: initialInvoice?.invPaymentStatusCode || "unpaid",
      tin: customerTin,
      note,
      customer: {
        id: partnerId,
        name: partnerName,
      },
      items: calculatedItems.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        measureUnit: i.measureUnit,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
        vatAmount: i.vat,
        totalPrice: i.total,
      })),
    };

    try {
      // Endpoint depends on type
      const endpoint = docType === "issued" ? "v1/invoices/invoicesIssued" : "v1/invoices/invoicesReceived";
      const url = isEdit 
        ? `/api/helios/${endpoint}/${payloadInvoice.id}` 
        : `/api/helios/${endpoint}`;
      
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadInvoice),
      });

      if (!res.ok) {
        console.warn("Helios API returned non-OK status, falling back to local dataset:", res.status);
      }
      
      // Update local ERP dataset
      onSave(payloadInvoice);
      onClose();
    } catch (err: unknown) {
      console.warn("Failed to reach Helios API directly, updating locally:", err);
      onSave(payloadInvoice);
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
        style={{ maxWidth: "980px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--brand-primary), #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isEdit ? "Úprava faktury" : "Nová faktura"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {docType === "issued" ? "Vydaná faktura odběrateli" : "Přijatá faktura od dodavatele"}
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
          {/* Section 1: Základní identifikační údaje dokladu */}
          <div className="form-section">
            <div className="form-section-title">
              <FileText size={15} />
              <span>Hlavička dokladu</span>
            </div>

            <div className="form-grid-3" style={{ marginBottom: "1rem" }}>
              <div>
                <label className="label-control">Typ faktury</label>
                <select
                  className="input-control"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as "issued" | "received")}
                >
                  <option value="issued">Faktura vydaná (Odběratelská)</option>
                  <option value="received">Faktura přijatá (Dodavatelská)</option>
                </select>
              </div>

              <div>
                <label className="label-control">Číslo dokladu *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="např. FV2026001"
                />
              </div>

              <div>
                <label className="label-control">Variabilní symbol</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={variableSymbol}
                  onChange={(e) => setVariableSymbol(e.target.value)}
                  placeholder="např. 2026001"
                />
              </div>
            </div>

            {/* Partner / Customer */}
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
                      {c.name} {c.tin ? `(IČO: ${c.tin})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-control">Obchodní název partnera *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Zadejte název společnosti..."
                />
              </div>

              <div>
                <label className="label-control">IČO / DIČ</label>
                <input
                  type="text"
                  className="input-control"
                  value={customerTin}
                  onChange={(e) => setCustomerTin(e.target.value)}
                  placeholder="např. 12345678"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Termíny a Platba */}
          <div className="form-section">
            <div className="form-section-title">
              <Calendar size={15} />
              <span>Termíny a platební podmínky</span>
            </div>

            <div className="form-grid-4">
              <div>
                <label className="label-control">Datum vystavení</label>
                <input
                  type="date"
                  className="input-control"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Datum splatnosti</label>
                <input
                  type="date"
                  className="input-control"
                  style={{ color: "var(--accent-amber)", fontWeight: 600 }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">DUZP (Zdanitelné plnění)</label>
                <input
                  type="date"
                  className="input-control"
                  value={vatDate}
                  onChange={(e) => setVatDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Způsob úhrady</label>
                <select
                  className="input-control"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="Převodem">Bankovní převod</option>
                  <option value="Hotově">Hotovost</option>
                  <option value="Karta">Platební karta</option>
                  <option value="Zápočet">Zápočet</option>
                  <option value="Dobírka">Dobírka</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: POLOŽKY DOKLADU (Interactive Line Items Editor) */}
          <div className="form-section" style={{ background: "rgba(15, 23, 42, 0.85)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div className="form-section-title" style={{ margin: 0 }}>
                <Package size={16} />
                <span>Položky faktury ({items.length})</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                {/* Quick Product Inserter from Warehouse */}
                {products.length > 0 && (
                  <select
                    className="input-control"
                    style={{ width: "auto", fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleAddItem(Number(e.target.value));
                    }}
                  >
                    <option value="">+ Vložit ze skladu / ceníku...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.referenceId || `#${p.id}`})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="btn btn-primary"
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", gap: "0.3rem" }}
                >
                  <Plus size={14} />
                  <span>Přidat volnou položku</span>
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="table-wrapper" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="erp-table" style={{ minWidth: "820px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Název / Popis položky</th>
                    <th style={{ width: "12%" }}>Množství</th>
                    <th style={{ width: "10%" }}>Jednotka</th>
                    <th style={{ width: "15%" }}>Cena / ks bez DPH</th>
                    <th style={{ width: "12%" }}>Sazba DPH</th>
                    <th style={{ width: "16%" }}>Celkem bez DPH</th>
                    <th style={{ width: "40px", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <input
                          type="text"
                          required
                          className="input-control"
                          style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          value={item.name || ""}
                          placeholder="Popis položky..."
                          onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                        />
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
                          style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", textAlign: "right", fontWeight: 600 }}
                          value={item.unitPrice ?? 0}
                          onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td>
                        <select
                          className="input-control"
                          style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          value={item.vatRate ?? 21}
                          onChange={(e) => handleUpdateItem(idx, { vatRate: parseInt(e.target.value, 10) })}
                        >
                          <option value={21}>21 %</option>
                          <option value={12}>12 %</option>
                          <option value={0}>0 % (Osvob.)</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {safeCurrency(item.base, currencyCode)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            color: items.length <= 1 ? "var(--text-dim)" : "var(--accent-rose)",
                            opacity: items.length <= 1 ? 0.3 : 1,
                            padding: "4px",
                          }}
                          title="Smazat položku"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VAT Recapitulation & Grand Total Summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}>
              {/* VAT Breakdown */}
              <div style={{ minWidth: "260px" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-dim)", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Rekapitulace DPH
                </div>
                <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ textAlign: "left", paddingBottom: "4px" }}>Sazba</th>
                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>Základ</th>
                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>DPH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vatSummary.map((v) => (
                      <tr key={v.rate} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "4px 0" }}>{v.rate} %</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{safeCurrency(v.base, currencyCode)}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>{safeCurrency(v.vat, currencyCode)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Display */}
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.5rem",
                textAlign: "right",
              }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Základ: <strong style={{ color: "var(--text-main)" }}>{safeCurrency(totalBase, currencyCode)}</strong> • DPH: <strong style={{ color: "var(--accent-amber)" }}>{safeCurrency(totalVat, currencyCode)}</strong>
                </div>
                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--brand-primary)", fontWeight: 800, marginTop: "0.25rem", letterSpacing: "0.04em" }}>
                  Celkem k úhradě
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", marginTop: "0.15rem" }}>
                  {safeCurrency(grandTotal, currencyCode)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Poznámka */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label-control">Poznámka k faktuře (bude uvedena na dokladu)</label>
            <textarea
              className="input-control"
              rows={2}
              style={{ resize: "vertical" }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Děkujeme za spolupráci. Splatnost dle smlouvy..."
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
              <span>{isSubmitting ? "Ukládám..." : isEdit ? "Uložit změny" : "Vystavit fakturu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
