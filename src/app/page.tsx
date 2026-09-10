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
import { Invoice, Product, Order, Customer, JobOrder, JobTask, DocumentItem, UserInfo } from "@/types/helios";

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
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [invoiceSubtype, setInvoiceSubtype] = useState<"issued" | "received">("issued");

  // Load all ERP data from Helios
  const loadErpData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [
        resInvIssued,
        resInvReceived,
        resProducts,
        resOrdRec,
        resOrdIss,
        resCust,
        resJobs,
        resTasks,
        resDocs,
      ] = await Promise.allSettled([
        fetch("/api/helios/v1/invoices/invoicesIssued"),
        fetch("/api/helios/v1/invoices/invoicesReceived"),
        fetch("/api/helios/v1/eshop/products"),
        fetch("/api/helios/v1/warehouse/ordersReceived"),
        fetch("/api/helios/v1/warehouse/ordersIssued"),
        fetch("/api/helios/v1/eshop/customers"),
        fetch("/api/helios/v1/jobOrder/jobOrders"),
        fetch("/api/helios/v1/jobOrder/tasks"),
        fetch("/api/helios/v1/Documents/DMSDocuments"),
      ]);

      if (resInvIssued.status === "fulfilled" && resInvIssued.value.ok) {
        const data = await resInvIssued.value.json().catch(() => []);
        setInvoicesIssued(Array.isArray(data) ? data : []);
      }

      if (resInvReceived.status === "fulfilled" && resInvReceived.value.ok) {
        const data = await resInvReceived.value.json().catch(() => []);
        setInvoicesReceived(Array.isArray(data) ? data : []);
      }

      if (resProducts.status === "fulfilled" && resProducts.value.ok) {
        const data = await resProducts.value.json().catch(() => []);
        setProducts(Array.isArray(data) ? data : []);
      }

      if (resOrdRec.status === "fulfilled" && resOrdRec.value.ok) {
        const data = await resOrdRec.value.json().catch(() => []);
        setOrdersReceived(Array.isArray(data) ? data : []);
      }

      if (resOrdIss.status === "fulfilled" && resOrdIss.value.ok) {
        const data = await resOrdIss.value.json().catch(() => []);
        setOrdersIssued(Array.isArray(data) ? data : []);
      }

      if (resCust.status === "fulfilled" && resCust.value.ok) {
        const data = await resCust.value.json().catch(() => []);
        setCustomers(Array.isArray(data) ? data : []);
      }

      if (resJobs.status === "fulfilled" && resJobs.value.ok) {
        const data = await resJobs.value.json().catch(() => []);
        setJobOrders(Array.isArray(data) ? data : []);
      }

      if (resTasks.status === "fulfilled" && resTasks.value.ok) {
        const data = await resTasks.value.json().catch(() => []);
        setTasks(Array.isArray(data) ? data : []);
      }

      if (resDocs.status === "fulfilled" && resDocs.value.ok) {
        const data = await resDocs.value.json().catch(() => []);
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading ERP datasets:", err);
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
        loadErpData();
      } catch {
        router.push("/login");
      }
    }
    checkAuth();
  }, [router, loadErpData]);

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
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === "invoices_issued") setInvoiceSubtype("issued");
          if (tab === "invoices_received") setInvoiceSubtype("received");
        }}
        dbProfile={userInfo?.dbprofile || "Demo"}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar
          title={getTitle()}
          userName={userInfo?.userName || "tester"}
          dbProfile={userInfo?.dbprofile || "Demo"}
          onRefresh={loadErpData}
          isRefreshing={isLoadingData}
        />

        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {currentTab === "dashboard" && (
            <DashboardView
              invoicesIssued={invoicesIssued}
              invoicesReceived={invoicesReceived}
              products={products}
              userInfo={userInfo}
              onNavigate={(tab) => {
                setCurrentTab(tab);
                if (tab === "invoices_issued") setInvoiceSubtype("issued");
                if (tab === "invoices_received") setInvoiceSubtype("received");
              }}
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
