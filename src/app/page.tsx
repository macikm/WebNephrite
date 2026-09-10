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

  // Helper fetcher
  const fetchModule = async (endpoint: string, key: string) => {
    try {
      const res = await fetch(`/api/helios/${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        return extractArray(json, key);
      }
    } catch (err) {
      console.error(`Error loading ${endpoint}:`, err);
    }
    return [];
  };

  // Load data for a specific tab or dashboard
  const loadDataForTab = useCallback(async (tab: TabId, force = false) => {
    setIsLoadingData(true);
    try {
      if (tab === "dashboard" || force) {
        // Load dashboard essentials
        const [issued, received, prods] = await Promise.all([
          fetchModule("v1/invoices/invoicesIssued", "invoicesIssued"),
          fetchModule("v1/invoices/invoicesReceived", "invoicesReceived"),
          fetchModule("v1/eshop/products", "products"),
        ]);
        setInvoicesIssued(issued as Invoice[]);
        setInvoicesReceived(received as Invoice[]);
        setProducts(prods as Product[]);
        setLoadedTabs(prev => ({ ...prev, dashboard: true, invoices_issued: true, invoices_received: true, products: true }));
      } else if (tab === "invoices_issued" || tab === "invoices_received") {
        const [issued, received] = await Promise.all([
          fetchModule("v1/invoices/invoicesIssued", "invoicesIssued"),
          fetchModule("v1/invoices/invoicesReceived", "invoicesReceived"),
        ]);
        setInvoicesIssued(issued as Invoice[]);
        setInvoicesReceived(received as Invoice[]);
        setLoadedTabs(prev => ({ ...prev, invoices_issued: true, invoices_received: true }));
      } else if (tab === "products") {
        const prods = await fetchModule("v1/eshop/products", "products");
        setProducts(prods as Product[]);
        setLoadedTabs(prev => ({ ...prev, products: true }));
      } else if (tab === "orders") {
        const [rec, iss] = await Promise.all([
          fetchModule("v1/warehouse/ordersReceived", "ordersReceived"),
          fetchModule("v1/warehouse/ordersIssued", "ordersIssued"),
        ]);
        setOrdersReceived(rec as Order[]);
        setOrdersIssued(iss as Order[]);
        setLoadedTabs(prev => ({ ...prev, orders: true }));
      } else if (tab === "customers") {
        const [cust, cont] = await Promise.all([
          fetchModule("v1/eshop/customers", "customers"),
          fetchModule("v1/general/contacts", "contacts"),
        ]);
        setCustomers(cust as Customer[]);
        setContacts(cont as ContactPerson[]);
        setLoadedTabs(prev => ({ ...prev, customers: true }));
      } else if (tab === "jobs") {
        const [jobs, jTasks] = await Promise.all([
          fetchModule("v1/jobOrder/jobOrders", "jobOrders"),
          fetchModule("v1/jobOrder/tasks", "tasks"),
        ]);
        setJobOrders(jobs as JobOrder[]);
        setTasks(jTasks as JobTask[]);
        setLoadedTabs(prev => ({ ...prev, jobs: true }));
      } else if (tab === "documents") {
        const docs = await fetchModule("v1/Documents/DMSDocuments", "documents");
        setDocuments(docs as DocumentItem[]);
        setLoadedTabs(prev => ({ ...prev, documents: true }));
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Check authentication on initial load
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
  }, [router, loadDataForTab]);

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
        />

        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
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
            />
          )}

          {currentTab === "products" && (
            <ProductsView
              products={products}
              isLoading={isLoadingData}
            />
          )}

          {currentTab === "orders" && (
            <OrdersView
              ordersReceived={ordersReceived}
              ordersIssued={ordersIssued}
              isLoading={isLoadingData}
            />
          )}

          {currentTab === "customers" && (
            <CustomersView
              customers={customers}
              contacts={contacts}
              isLoading={isLoadingData}
            />
          )}

          {currentTab === "jobs" && (
            <JobsView
              jobOrders={jobOrders}
              tasks={tasks}
              isLoading={isLoadingData}
            />
          )}

          {currentTab === "documents" && (
            <DocumentsView
              documents={documents}
              isLoading={isLoadingData}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView userInfo={userInfo} />
          )}
        </main>
      </div>
    </div>
  );
}
