"use client";

import { useState } from "react";
import { UserInfo } from "@/types/helios";
import { Server, Database, User, Shield, Terminal, Play, ExternalLink, Globe } from "lucide-react";

interface SettingsViewProps {
  userInfo?: UserInfo | null;
}

export function SettingsView({ userInfo }: SettingsViewProps) {
  const [testEndpoint, setTestEndpoint] = useState("/api/Connect/UserInfo");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runTest = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const cleanPath = testEndpoint.startsWith("/api/") 
        ? testEndpoint.replace(/^\/api\//, "") 
        : testEndpoint.replace(/^\//, "");
      const res = await fetch(`/api/helios/${cleanPath}`);
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setTestResponse(JSON.stringify({ error: err instanceof Error ? err.message : "Chyba" }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* System Status Banner */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Server size={18} style={{ color: "var(--brand-primary)" }} />
          <span>Konfigurace a stav propojení s Helios Nephrite</span>
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}>
          <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>Helios API Server</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 600, marginTop: "0.3rem" }}>
              https://demo-api.helios.eu
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--status-paid)", marginTop: "0.25rem" }}>● Provozuschopné (HTTP 200)</div>
          </div>

          <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>Aplikační server (HeG Noris)</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 600, marginTop: "0.3rem" }}>
              {userInfo?.serverUrl || "https://open.helios.eu/DemoNephrite"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", marginTop: "0.25rem" }}>Profil: {userInfo?.dbprofile || "Demo"}</div>
          </div>

          <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>Přihlášený uživatel</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.3rem" }}>
              {userInfo?.userName || "tester"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Role: {userInfo?.systemRole || "user"} • Jazyk: {userInfo?.languageId || "CZ"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem" }}>
          <a
            href="https://demo-api.helios.eu/docs/index.html"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            <span>Otevřít oficiální Swagger dokumentaci</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Live API Console / Inspector */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Terminal size={18} style={{ color: "var(--accent-cyan)" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Interaktivní API konzole</h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Otestujte libovolný endpoint z Helios Nephrite API s aktivní autorizací:
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            type="text"
            className="input-control"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}
            value={testEndpoint}
            onChange={(e) => setTestEndpoint(e.target.value)}
            placeholder="/api/v1/invoices/invoicesIssued"
          />
          <button
            onClick={runTest}
            disabled={isTesting}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            <Play size={15} />
            <span>{isTesting ? "Dotazuji..." : "Odeslat GET"}</span>
          </button>
        </div>

        {/* Quick Endpoint Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setTestEndpoint("/api/Connect/UserInfo")}
            className="badge badge-info"
            style={{ cursor: "pointer" }}
          >
            /api/Connect/UserInfo
          </button>
          <button
            onClick={() => setTestEndpoint("/api/v1/invoices/invoicesIssued")}
            className="badge badge-info"
            style={{ cursor: "pointer" }}
          >
            /api/v1/invoices/invoicesIssued
          </button>
          <button
            onClick={() => setTestEndpoint("/api/v1/eshop/products")}
            className="badge badge-info"
            style={{ cursor: "pointer" }}
          >
            /api/v1/eshop/products
          </button>
          <button
            onClick={() => setTestEndpoint("/api/v1/eshop/customers")}
            className="badge badge-info"
            style={{ cursor: "pointer" }}
          >
            /api/v1/eshop/customers
          </button>
          <button
            onClick={() => setTestEndpoint("/api/v1/jobOrder/jobOrders")}
            className="badge badge-info"
            style={{ cursor: "pointer" }}
          >
            /api/v1/jobOrder/jobOrders
          </button>
        </div>

        {/* Response display */}
        {testResponse && (
          <div style={{
            background: "#080c14",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            maxHeight: "400px",
            overflowY: "auto",
          }}>
            <pre style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "#a5f3fc",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}>
              {testResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
