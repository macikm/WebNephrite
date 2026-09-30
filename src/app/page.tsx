"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, TabId } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { InvoicesView } from "@/components/InvoicesView";
import { ProductsView } from "@/components/ProductsView";
import { OrdersView } from "@/components/OrdersView";
import { CustomersView } from "@/components/CustomersView";
import { JobsView } from "@/components/JobsView";
import { DocumentsView } from "@/components/DocumentsView";
import { SettingsView } from "@/components/SettingsView";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { Invoice, Product, Order, Customer, ContactPerson, JobOrder, JobTask, DocumentItem, UserInfo } from "@/types/helios";

// Helper to safely extract an array from Helios responses (handles both direct arrays and wrapped objects like { products: [...] })
function extractArray<T>(data: unknown, preferredKey?: string): T[] {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data)) return data as T[];

  const record = data as Record<string, unknown>;
  if (preferredKey && Array.isArray(record[preferredKey])) {
    return record[preferredKey] as T[];
  }

  // Find first array property
  for (const key of Object.keys(record)) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }
  return [];
}

export default function HomePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TabId>("dashboard");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // ERP Datasets
  const [invoicesIssued, setInvoicesIssued] = useState<Invoice[]>([]);
  const [invoicesReceived, setInvoicesReceived] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersReceived, setOrdersReceived] = useState<Order[]>([]);
  const [ordersIssued, setOrdersIssued] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [invoiceSubtype, setInvoiceSubtype] = useState<"issued" | "received">("issued");

  // Track loaded tabs to avoid duplicate fetching
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: "success" | "error" | "info" | "warning", text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Save handlers with optimistic/real-time state updates
  const handleSaveInvoice = useCallback((saved: Invoice) => {
    const isIssued = saved.documentTypeCode === "issued" || 
      (!saved.documentTypeCode && (saved.invoiceNo?.startsWith("FV") || invoiceSubtype === "issued"));

    if (isIssued) {
      setInvoicesIssued(prev => {
        const index = prev.findIndex(i => i.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showToast("success", `Faktura vydaná #${saved.invoiceNo || saved.id} byla úspěšně uložena.`);
    } else {
      setInvoicesReceived(prev => {
        const index = prev.findIndex(i => i.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showToast("success", `Faktura přijatá #${saved.invoiceNo || saved.id} byla úspěšně uložena.`);
    }
  }, [invoiceSubtype, showToast]);

  const handleSaveOrder = useCallback((saved: Order) => {
    const isRec = ordersReceived.some(o => o.id === saved.id) || !ordersIssued.some(o => o.id === saved.id);
    if (isRec) {
      setOrdersReceived(prev => {
        const idx = prev.findIndex(o => o.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
    } else {
      setOrdersIssued(prev => {
        const idx = prev.findIndex(o => o.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
    }
    showToast("success", `Objednávka #${saved.orderNumber || saved.id} byla úspěšně uložena.`);
  }, [ordersReceived, ordersIssued, showToast]);

  const handleSaveProduct = useCallback((saved: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Produkt "${saved.name}" byl úspěšně uložen do skladu.`);
  }, [showToast]);

  const handleSaveCustomer = useCallback((saved: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Partner "${saved.name}" byl úspěšně uložen do adresáře.`);
  }, [showToast]);

  const handleSaveContact = useCallback((saved: ContactPerson) => {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Kontaktní osoba "${saved.name || `${saved.firstName || ""} ${saved.lastName || ""}`}" byla úspěšně uložena.`);
  }, [showToast]);

  const handleSaveJob = useCallback((saved: JobOrder) => {
    setJobOrders(prev => {
      const idx = prev.findIndex(j => j.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Zakázka #${saved.number || saved.id} byla úspěšně uložena.`);
  }, [showToast]);

  const handleSaveTask = useCallback((saved: JobTask) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Úkol "${saved.name}" byl úspěšně uložen.`);
  }, [showToast]);

  const handleSaveDocument = useCallback((saved: DocumentItem) => {
    setDocuments(prev => {
      const idx = prev.findIndex(d => d.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    showToast("success", `Dokument "${saved.name}" byl úspěšně zaevidován do DMS.`);
  }, [showToast]);

  // Helper fetcher (returns null on error to avoid wiping existing data)
  const fetchModule = async (endpoint: string, key: string): Promise<any[] | null> => {
    try {
      const res = await fetch(`/api/helios/${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        return extractArray(json, key);
      }
      console.warn(`API returned status ${res.status} for ${endpoint}`);
    } catch (err) {
      console.error(`Error loading ${endpoint}:`, err);
    }
    return null;
  };

  // Helper to load customers
  const loadCustomersData = async () => {
    const [orgs, cont] = await Promise.all([
      fetchModule("v1/Generic/browse/12?Top=250", "data"),
      fetchModule("v1/general/contacts?Top=250", "contacts"),
    ]);

    let loadedCustomers: Customer[] = [];
    if (orgs && orgs.length > 0) {
      loadedCustomers = (orgs as Array<Record<string, unknown>>).map((o) => ({
        id: Number(o.organizace_cislo_subjektu || o.id || 0),
        number: String(o.organizace_reference_subjektu || o.number || o.organizace_cislo_subjektu || ""),
        name: String(o.organizace_nazev_subjektu || o.name || "Neznámá společnost"),
        tin: o.organizace_ico ? String(o.organizace_ico) : undefined,
        vatId: o.organizace_dic ? String(o.organizace_dic) : undefined,
        street: o.organizace_ulice ? String(o.organizace_ulice) : undefined,
        city: o.organizace_misto ? String(o.organizace_misto) : undefined,
        zipCode: o.organizace_psc ? String(o.organizace_psc) : undefined,
        country: o.zeme_iso_kod_zeme ? String(o.zeme_iso_kod_zeme) : "CZ",
        turnoverFV: typeof o.FV === "number" ? o.FV : undefined,
        turnoverFD: typeof o.FD === "number" ? o.FD : undefined,
      }));
    } else {
      const fallback = await fetchModule("v1/eshop/customers?Top=250", "customers");
      if (fallback !== null) loadedCustomers = fallback as Customer[];
    }
    if (loadedCustomers.length > 0) setCustomers(loadedCustomers);
    if (cont !== null) setContacts(cont as ContactPerson[]);
    setLoadedTabs(prev => ({ ...prev, customers: true }));
  };

  // Load data for a specific tab or dashboard
  const loadDataForTab = useCallback(async (tab: TabId, force = false) => {
    setIsLoadingData(true);
    try {
      if (tab === "dashboard" || force) {
        // Load dashboard essentials + prefetch customers & products
        const [issued, received, prods] = await Promise.all([
          fetchModule("v1/invoices/invoicesIssued?Top=250", "invoicesIssued"),
          fetchModule("v1/invoices/invoicesReceived?Top=250", "invoicesReceived"),
          fetchModule("v1/eshop/products?Top=250", "products"),
        ]);
        if (issued !== null) setInvoicesIssued(issued as Invoice[]);
        if (received !== null) setInvoicesReceived(received as Invoice[]);
        if (prods !== null) setProducts(prods as Product[]);
        setLoadedTabs(prev => ({ ...prev, dashboard: true, invoices_issued: true, invoices_received: true, products: true }));
        // Also prefetch customers in background for picker dropdowns
        loadCustomersData();
      } else if (tab === "invoices_issued" || tab === "invoices_received") {
        const [issued, received] = await Promise.all([
          fetchModule("v1/invoices/invoicesIssued?Top=250", "invoicesIssued"),
          fetchModule("v1/invoices/invoicesReceived?Top=250", "invoicesReceived"),
        ]);
        if (issued !== null) setInvoicesIssued(issued as Invoice[]);
        if (received !== null) setInvoicesReceived(received as Invoice[]);
        setLoadedTabs(prev => ({ ...prev, invoices_issued: true, invoices_received: true }));
        // Prefetch customers & products if not loaded yet
        if (customers.length === 0) loadCustomersData();
        if (products.length === 0) {
          fetchModule("v1/eshop/products?Top=250", "products").then(p => {
            if (p !== null) setProducts(p as Product[]);
          });
        }
      } else if (tab === "products") {
        const prods = await fetchModule("v1/eshop/products?Top=250", "products");
        if (prods !== null) setProducts(prods as Product[]);
        setLoadedTabs(prev => ({ ...prev, products: true }));
      } else if (tab === "orders") {
        const [rec, iss] = await Promise.all([
          fetchModule("v1/warehouse/ordersReceived?Top=250", "ordersReceived"),
          fetchModule("v1/warehouse/ordersIssued?Top=250", "ordersIssued"),
        ]);
        if (rec !== null) setOrdersReceived(rec as Order[]);
        if (iss !== null) setOrdersIssued(iss as Order[]);
        setLoadedTabs(prev => ({ ...prev, orders: true }));
        if (customers.length === 0) loadCustomersData();
        if (products.length === 0) {
          fetchModule("v1/eshop/products?Top=250", "products").then(p => {
            if (p !== null) setProducts(p as Product[]);
          });
        }
      } else if (tab === "customers") {
        await loadCustomersData();
      } else if (tab === "jobs") {
        const [jobs, jTasks] = await Promise.all([
          fetchModule("v1/jobOrder/jobOrders?Top=250", "jobOrders"),
          fetchModule("v1/jobOrder/tasks?Top=250", "tasks"),
        ]);
        if (jobs !== null) setJobOrders(jobs as JobOrder[]);
        if (jTasks !== null) setTasks(jTasks as JobTask[]);
        setLoadedTabs(prev => ({ ...prev, jobs: true }));
        if (customers.length === 0) loadCustomersData();
      } else if (tab === "documents") {
        let docs = await fetchModule("v1/Documents/DMSDocuments?Top=100", "documents");
        if (!docs || docs.length === 0) {
          docs = await fetchModule("v1/Documents/ExternalDocuments?Top=100", "documents");
        }
        if (docs !== null) setDocuments(docs as DocumentItem[]);
        setLoadedTabs(prev => ({ ...prev, documents: true }));
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [customers.length, products.length]);

  // Check authentication on initial load (runs once on mount)
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
        setUserInfo(data.user);
        setIsAuthChecking(false);
        loadDataForTab("dashboard");
      } catch {
        router.push("/login");
      }
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tab switching and on-demand loading
  const handleSelectTab = (tab: TabId) => {
    setCurrentTab(tab);
    if (tab === "invoices_issued") setInvoiceSubtype("issued");
    if (tab === "invoices_received") setInvoiceSubtype("received");

    if (!loadedTabs[tab]) {
      loadDataForTab(tab);
    }
  };

  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(16, 185, 129, 0.2)",
          borderTopColor: "var(--brand-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Ověřuji spojení s Helios Nephrite...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const getTitle = () => {
    switch (currentTab) {
      case "dashboard": return "Přehled systému & KPI";
      case "invoices_issued": return "Faktury vydané";
      case "invoices_received": return "Faktury přijaté";
      case "products": return "Katalog produktů & Sklad";
      case "orders": return "Správa objednávek";
      case "customers": return "Adresář zákazníků & Partnerů";
      case "jobs": return "Zakázky a plnění úkolů";
      case "documents": return "Správa dokumentů DMS";
      case "settings": return "Konfigurace & API konzole";
      default: return "WebNephrite ERP";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        dbProfile={userInfo?.dbprofile || "Demo"}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar
          title={getTitle()}
          userName={userInfo?.userName || "tester"}
          dbProfile={userInfo?.dbprofile || "Demo"}
          onRefresh={() => loadDataForTab(currentTab, true)}
          isRefreshing={isLoadingData}
          onOpenSettings={() => handleSelectTab("settings")}
        />

        <main style={{ flex: 1, padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {currentTab === "dashboard" && (
              <DashboardView
                invoicesIssued={invoicesIssued}
                invoicesReceived={invoicesReceived}
                products={products}
                userInfo={userInfo}
                onNavigate={handleSelectTab}
                isLoading={isLoadingData}
              />
            )}

            {(currentTab === "invoices_issued" || currentTab === "invoices_received") && (
              <InvoicesView
                invoicesIssued={invoicesIssued}
                invoicesReceived={invoicesReceived}
                activeType={invoiceSubtype}
                onChangeType={(type) => {
                  setInvoiceSubtype(type);
                  setCurrentTab(type === "issued" ? "invoices_issued" : "invoices_received");
                }}
                isLoading={isLoadingData}
                customers={customers}
                products={products}
                onSaveInvoice={handleSaveInvoice}
              />
            )}

            {currentTab === "products" && (
              <ProductsView
                products={products}
                isLoading={isLoadingData}
                onSaveProduct={handleSaveProduct}
              />
            )}

            {currentTab === "orders" && (
              <OrdersView
                ordersReceived={ordersReceived}
                ordersIssued={ordersIssued}
                isLoading={isLoadingData}
                customers={customers}
                products={products}
                onSaveOrder={handleSaveOrder}
              />
            )}

            {currentTab === "customers" && (
              <CustomersView
                customers={customers}
                contacts={contacts}
                isLoading={isLoadingData}
                onSaveCustomer={handleSaveCustomer}
                onSaveContact={handleSaveContact}
              />
            )}

            {currentTab === "jobs" && (
              <JobsView
                jobOrders={jobOrders}
                tasks={tasks}
                isLoading={isLoadingData}
                customers={customers}
                onSaveJob={handleSaveJob}
                onSaveTask={handleSaveTask}
              />
            )}

            {currentTab === "documents" && (
              <DocumentsView
                documents={documents}
                isLoading={isLoadingData}
                onSaveDocument={handleSaveDocument}
              />
            )}

            {currentTab === "settings" && (
              <SettingsView userInfo={userInfo} />
            )}
          </div>

          {/* ASOL Footer matching Screenshot 2, 3, 4 */}
          <footer style={{
            marginTop: "1.5rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid #e2e8f0",
            fontSize: "0.725rem",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}>
            <div>© 2026 - Asseco Solutions, a.s.</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#94a3b8" }}>
              Debug režim: Aktivní Zařízení: Desktop Platforma: Win32 | Verze: 48.2.3.0 Helios: open.helios.eu | Profil: <strong style={{ color: "#0284c7" }}>{userInfo?.dbprofile || "Demo"}</strong> | Uživatel: <strong style={{ color: "#334155" }}>{userInfo?.userName || "Martin Macko"}</strong>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
