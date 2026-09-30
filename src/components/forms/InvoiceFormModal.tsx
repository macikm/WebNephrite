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
  AlertCircle,
  CornerUpLeft
} from "lucide-react";
import { Invoice, InvoiceItem, Customer, Product } from "@/types/helios";
import { safeCurrency, safeNumber } from "@/lib/table-utils";
import { ProductPickerModal } from "./ProductPickerModal";
import { useEscapeKey } from "@/lib/useEscapeKey";

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
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const activeInitial = initialInvoice || initialData;
  const isEdit = Boolean(activeInitial);

  // Form State
  const [docType, setDocType] = useState<"issued" | "received">(
    activeInitial?.documentTypeCode === "received" ? "received" : (activeInitial ? defaultType : defaultType)
  );
  const [invoiceNo, setInvoiceNo] = useState(
    activeInitial?.invoiceNo || activeInitial?.number || `FV${new Date().getFullYear()}${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [variableSymbol, setVariableSymbol] = useState(
    activeInitial?.variableSymbol || invoiceNo.replace(/\D/g, "") || String(Date.now()).slice(-8)
  );
  const [constantSymbol, setConstantSymbol] = useState(activeInitial?.constantSymbol || "0308");
  
  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">(
    activeInitial?.customer?.id || ""
  );
  const [customCustomerName, setCustomCustomerName] = useState(
    activeInitial?.customer?.name || ""
  );
  const [customerTin, setCustomerTin] = useState(activeInitial?.tin || "");

  // Dates
  const todayStr = new Date().toISOString().split("T")[0];
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [issueDate, setIssueDate] = useState(
    activeInitial?.issueDate ? activeInitial.issueDate.split("T")[0] : todayStr
  );
  const [dueDate, setDueDate] = useState(
    activeInitial?.dueDate ? activeInitial.dueDate.split("T")[0] : in14Days
  );
  const [vatDate, setVatDate] = useState(
    activeInitial?.vatDate ? activeInitial.vatDate.split("T")[0] : todayStr
  );

  // Payment & Currency
  const [paymentType, setPaymentType] = useState(activeInitial?.paymentType || "Bankovní převod");
  const [currencyCode, setCurrencyCode] = useState(activeInitial?.currencyCode || "CZK");
  const [note, setNote] = useState(activeInitial?.note || "");

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    activeInitial?.items && activeInitial.items.length > 0 ? activeInitial.items : []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Product Picker Modal state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerTargetRow, setPickerTargetRow] = useState<number | "new">("new");

  // Helper to map legacy VAT rates (10% or 15%) to standard 21%
  const resolveVatRate = (rawRate: any): number => {
    const num = Number(rawRate);
    if (isNaN(num)) return 21;
    if (num === 10 || num === 15) return 21;
    return num;
  };

  // When customer dropdown changes
  const handleCustomerSelect = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId("");
      return;
    }
    const cId = Number(idStr);
    setSelectedCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomCustomerName(found.name);
      setCustomerTin(found.tin || "");
    }
  };

  // Add Item
  const handleAddItem = (product?: Product) => {
    const newItem: InvoiceItem = {
      id: Math.floor(Math.random() * 900000) + 100000,
      productId: product?.id,
      name: product?.name || "",
      quantity: 1,
      measureUnit: product?.measureUnit || "ks",
      unitPrice: product?.price ? Number(product.price) : 0,
      vatRate: resolveVatRate(product?.vatRate ?? 21),
    };
    setItems((prev) => [...prev, newItem]);
  };

  // When a product is selected from ProductPickerModal
  const handleProductPicked = (p: Product) => {
    const vat = resolveVatRate(p.vatRate ?? 21);
    const price = Number(p.price) || 0;
    const unit = p.measureUnit || "ks";

    if (pickerTargetRow === "new") {
      handleAddItem(p);
    } else {
      setItems((prev) => {
        const copy = [...prev];
        if (copy[pickerTargetRow]) {
          copy[pickerTargetRow] = {
            ...copy[pickerTargetRow],
            productId: p.id,
            name: p.name,
            measureUnit: unit,
            unitPrice: price,
            vatRate: vat,
          };
        }
        return copy;
      });
    }
    setIsProductPickerOpen(false);
  };

  // Line item text input with autocomplete
  const handleItemNameChange = (index: number, val: string) => {
    const matchedProduct = products.find(
      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
    );

    if (matchedProduct) {
      handleUpdateItem(index, "name", matchedProduct.name);
      handleUpdateItem(index, "productId", matchedProduct.id);
      if (matchedProduct.price) {
        handleUpdateItem(index, "unitPrice", Number(matchedProduct.price));
      }
      if (matchedProduct.measureUnit) {
        handleUpdateItem(index, "measureUnit", matchedProduct.measureUnit);
      }
      handleUpdateItem(index, "vatRate", resolveVatRate(matchedProduct.vatRate ?? 21));
    } else {
      handleUpdateItem(index, "name", val);
    }
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculate items and subtotals
  const calculatedItems = items.map((item) => {
    const qty = safeNumber(item.quantity, 0);
    const price = safeNumber(item.unitPrice, 0);
    const vatRate = safeNumber(item.vatRate, 21);

    const base = Math.round(qty * price * 100) / 100;
    const vat = Math.round(base * (vatRate / 100) * 100) / 100;
    const total = Math.round((base + vat) * 100) / 100;

    return {
      ...item,
      base,
      vat,
      total,
    };
  });

  const totalBase = calculatedItems.reduce((acc, i) => acc + i.base, 0);
  const totalVat = calculatedItems.reduce((acc, i) => acc + i.vat, 0);
  const grandTotal = totalBase + totalVat;

  // Breakdown of VAT by rate
  const vatBreakdown = calculatedItems.reduce((acc, item) => {
    const rate = item.vatRate ?? 21;
    if (!acc[rate]) {
      acc[rate] = { base: 0, vat: 0, total: 0 };
    }
    acc[rate].base += item.base;
    acc[rate].vat += item.vat;
    acc[rate].total += item.total;
    return acc;
  }, {} as Record<number, { base: number; vat: number; total: number }>);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent, closeAfter = true) => {
    if (e) e.preventDefault();
    if (calculatedItems.length === 0) {
      setErrorMessage("Faktura musí obsahovat alespoň jednu položku.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const partnerName = customCustomerName.trim() || "Nezadaný partner";
    const partnerId = typeof selectedCustomerId === "number" ? selectedCustomerId : undefined;

    const payloadInvoice: Invoice = {
      id: activeInitial?.id || Math.floor(Math.random() * 90000) + 10000,
      number: invoiceNo,
      invoiceNo: invoiceNo,
      documentTypeCode: docType,
      variableSymbol: variableSymbol || invoiceNo.replace(/\D/g, ""),
      constantSymbol,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      vatDate: new Date(vatDate).toISOString(),
      currencyCode,
      paymentType,
      totalAmount: grandTotal,
      outstandingAmount: activeInitial?.outstandingAmount ?? grandTotal,
      invPaymentStatusCode: activeInitial?.invPaymentStatusCode || "unpaid",
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
        console.warn("Helios API non-OK, updating local state:", res.status);
      }
      
      onSave(payloadInvoice);
      if (closeAfter) {
        onClose();
      }
    } catch (err: unknown) {
      console.warn("Helios API error, saving locally:", err);
      onSave(payloadInvoice);
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
        style={{ maxWidth: "1120px", padding: "1.5rem" }}
      >
        {/* Breadcrumbs */}
        <div className="asol-breadcrumb" style={{ margin: "0 0 1rem 0" }}>
          <span className="link">Dashboard</span>
          <span className="separator">/</span>
          <span className="link">Finance</span>
          <span className="separator">/</span>
          <span className="link">{docType === "issued" ? "Faktury vydané" : "Faktury přijaté"}</span>
          <span className="separator">/</span>
          <span className="current">{invoiceNo}:</span>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, false)}
              disabled={isSubmitting}
              className="asol-btn-save"
              title="Uložit změny na dokladu"
            >
              <Save size={15} />
              <span>{isSubmitting ? "Ukládám..." : "Uložit"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(undefined, true)}
              disabled={isSubmitting}
              className="asol-btn-save"
              title="Uložit a vrátit se do přehledu"
            >
              <CornerUpLeft size={15} />
              <span>Uložit a zpět</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="asol-btn-back"
              title="Zavřít bez uložení"
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
            Doklad: <strong style={{ color: "#0284c7" }}>{invoiceNo}</strong> ({docType === "issued" ? "Vydaná faktura" : "Přijatá faktura"})
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

        <form onSubmit={(e) => handleSubmit(e, true)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* SECTION 1: HLAVIČKA DOKLADU (Unified on same screen) */}
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
              <FileText size={15} />
              <span>Hlavička faktury</span>
            </div>

            {/* Row 1: Typ faktury, Číslo, VS, KS */}
            <div className="form-grid-4">
              <div>
                <label className="label-control">Typ faktury</label>
                <select
                  className="input-control"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as "issued" | "received")}
                >
                  <option value="issued">Faktura vydaná (odběratel)</option>
                  <option value="received">Faktura přijatá (dodavatel)</option>
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
                />
              </div>

              <div>
                <label className="label-control">Variabilní symbol *</label>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={variableSymbol}
                  onChange={(e) => setVariableSymbol(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Konstantní symbol</label>
                <input
                  type="text"
                  className="input-control"
                  value={constantSymbol}
                  onChange={(e) => setConstantSymbol(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Odběratel, Obchodní název, IČO */}
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
                      {c.name} {c.tin ? `(${c.tin})` : ""}
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
                  placeholder="Název firmy nebo jméno..."
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

            {/* Row 3: Termíny a Platba */}
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
                <label className="label-control">DUZP</label>
                <input
                  type="date"
                  className="input-control"
                  value={vatDate}
                  onChange={(e) => setVatDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Datum splatnosti</label>
                <input
                  type="date"
                  className="input-control"
                  style={{ fontWeight: 600 }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-control">Způsob úhrady</label>
                <select
                  className="input-control"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="Bankovní převod">Bankovní převod</option>
                  <option value="Platební příkaz">Platební příkaz</option>
                  <option value="Hotovost">Hotovost</option>
                  <option value="Platební karta">Platební karta</option>
                  <option value="Zápočet">Zápočet</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: POLOŽKY DOKLADU (Directly beneath header on the SAME view) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}>
            {/* Items Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#0284c7", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Package size={15} />
                <span>Položky faktury ({items.length})</span>
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

            {/* Datalist for live suggestions */}
            <datalist id="invoice-products-datalist">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.referenceId ? `[${p.referenceId}] ` : ""}{p.price ? `${safeCurrency(p.price)}` : ""}
                </option>
              ))}
            </datalist>

            {/* Items Table */}
            <div className="table-wrapper" style={{ maxHeight: "360px", overflowY: "auto" }}>
              <table className="erp-table" style={{ minWidth: "960px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "35px", textAlign: "center" }}>ř.</th>
                    <th style={{ width: "115px" }}>Č. zboží</th>
                    <th>Zboží / Popis položky</th>
                    <th style={{ width: "80px" }}>Počet</th>
                    <th style={{ width: "65px" }}>MJ</th>
                    <th style={{ width: "85px" }}>Kód DPH</th>
                    <th style={{ width: "105px" }}>Sazba DPH</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Cena/j bez DPH</th>
                    <th style={{ width: "115px", textAlign: "right" }}>Cena základ</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Cena celkem</th>
                    <th style={{ width: "45px", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748b" }}>
                        Faktura zatím neobsahuje žádné položky. Klikněte na <strong>Vybrat ze skladu / ceníku</strong> nebo <strong>Přidat volný řádek</strong>.
                      </td>
                    </tr>
                  ) : (
                    calculatedItems.map((item, idx) => (
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
                              list="invoice-products-datalist"
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
                        <td style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "0.775rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                            {item.vatRate === 21 ? "210" : item.vatRate === 12 ? "120" : item.vatRate === 15 ? "150" : item.vatRate === 10 ? "100" : "000"}
                          </span>
                        </td>
                        <td>
                          <select
                            className="input-control"
                            style={{ padding: "0.3rem 0.35rem", fontSize: "0.825rem" }}
                            value={item.vatRate ?? 21}
                            onChange={(e) => handleUpdateItem(idx, "vatRate", parseFloat(e.target.value))}
                          >
                            <option value={21}>21 %</option>
                            <option value={15}>15 %</option>
                            <option value={12}>12 %</option>
                            <option value={10}>10 %</option>
                            <option value={0}>0 %</option>
                          </select>
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
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {safeCurrency(item.base)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#0284c7" }}>
                          {safeCurrency(item.total)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rekapitulace DPH a Souhrn */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Rekapitulace DPH
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#334155", flexWrap: "wrap" }}>
                  {Object.entries(vatBreakdown).map(([rate, vals]) => (
                    <div key={rate} style={{ padding: "0.25rem 0.6rem", background: "#ffffff", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                      <span>Sazba {rate} %: </span>
                      <strong>Základ {safeCurrency(vals.base)}</strong> • 
                      <span> DPH {safeCurrency(vals.vat)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Základ: <strong>{safeCurrency(totalBase)}</strong> • DPH: <strong>{safeCurrency(totalVat)}</strong>
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0284c7", marginTop: "0.2rem" }}>
                  Celkem k úhradě: {safeCurrency(grandTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: POZNÁMKA & BANKOVNÍ SPOJENÍ */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "1.25rem",
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "1rem",
          }}>
            <div>
              <label className="label-control">Měna a Bankovní spojení</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <select
                  className="input-control"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                >
                  <option value="CZK">CZK - Česká koruna</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dolar</option>
                </select>
                <input
                  type="text"
                  className="input-control"
                  defaultValue="111263671/0300"
                  placeholder="Vlastní bankovní účet"
                />
              </div>
            </div>

            <div>
              <label className="label-control">Poznámka k faktuře (uvedena na dokladu)</label>
              <textarea
                className="input-control"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Děkujeme za spolupráci. Splatnost faktury dle smlouvy..."
              />
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div style={{
            paddingTop: "0.5rem",
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
              WebNephrite • Helios Nephrite Client
            </div>
          </div>
        </form>

        {/* Product Picker Modal */}
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
