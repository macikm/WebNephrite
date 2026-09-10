"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  User, 
  Server, 
  Database, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("tester");
  const [password, setPassword] = useState("tester");
  const [dbProfile, setDbProfile] = useState("Demo");
  const [serverURL, setServerURL] = useState("https://open.helios.eu/DemoNephrite");
  const [languageId, setLanguageId] = useState("CZ");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          password,
          dbProfile,
          serverURL,
          languageId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.errorMessage || "Chyba při přihlašování.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nepodařilo se přihlásit");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUserName("tester");
    setPassword("tester");
    setDbProfile("Demo");
    setServerURL("https://open.helios.eu/DemoNephrite");
    setLanguageId("CZ");
    setError(null);
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "460px",
        padding: "2.5rem 2rem",
        zIndex: 1,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "54px",
            height: "54px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "var(--brand-primary)",
            marginBottom: "1rem",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Web<span style={{ color: "var(--brand-primary)" }}>Nephrite</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            Podnikový informační systém Helios Nephrite
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "0.85rem 1rem",
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "#fda4af",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.65rem",
            marginBottom: "1.25rem",
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* User Name */}
          <div>
            <label className="label-control">Uživatelské jméno</label>
            <div style={{ position: "relative" }}>
              <User size={17} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: "2.4rem" }}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="např. tester nebo jmeno.prijmeni"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label-control">Heslo</label>
            <div style={{ position: "relative" }}>
              <Lock size={17} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }} />
              <input
                type={showPassword ? "text" : "password"}
                className="input-control"
                style={{ paddingLeft: "2.4rem", paddingRight: "2.4rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vaše přístupové heslo"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginTop: "0.2rem",
              }}
            >
              <span>Parametry serveru a profilu ({dbProfile})</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Advanced options accordion */}
          {showAdvanced && (
            <div className="animate-fade-in" style={{
              background: "rgba(10, 15, 26, 0.6)",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}>
              <div>
                <label className="label-control" style={{ fontSize: "0.75rem" }}>Profil databáze</label>
                <div style={{ position: "relative" }}>
                  <Database size={15} style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                  }} />
                  <select
                    className="input-control"
                    style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                    value={dbProfile}
                    onChange={(e) => setDbProfile(e.target.value)}
                  >
                    <option value="Demo">Demo (Přednastaveno)</option>
                    <option value="Produkce">Produkce</option>
                    <option value="Vyvoj">Vývoj / Test</option>
                    <option value="Vlastni">Vlastní profil...</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-control" style={{ fontSize: "0.75rem" }}>Server URL</label>
                <div style={{ position: "relative" }}>
                  <Server size={15} style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                  }} />
                  <input
                    type="text"
                    className="input-control"
                    style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                    value={serverURL}
                    onChange={(e) => setServerURL(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label-control" style={{ fontSize: "0.75rem" }}>Jazyk rozhraní</label>
                <div style={{ position: "relative" }}>
                  <Globe size={15} style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                  }} />
                  <select
                    className="input-control"
                    style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
                    value={languageId}
                    onChange={(e) => setLanguageId(e.target.value)}
                  >
                    <option value="CZ">CZ - Čeština</option>
                    <option value="SK">SK - Slovenčina</option>
                    <option value="EN">EN - English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}
          >
            {loading ? (
              <span>Připojuji k Helios Nephrite...</span>
            ) : (
              <>
                <span>Přihlásit se do systému</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>

          {/* Quick Demo Fill button */}
          <button
            type="button"
            onClick={fillDemo}
            className="btn btn-secondary"
            style={{ width: "100%", fontSize: "0.8rem", padding: "0.55rem" }}
          >
            <Sparkles size={14} style={{ color: "var(--accent-amber)" }} />
            <span>Předvyplnit Demo účet (tester / tester)</span>
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: "1.75rem",
          fontSize: "0.75rem",
          color: "var(--text-dim)",
        }}>
          WebNephrite • Propojeno s Helios Nephrite API v8.0
        </div>
      </div>
    </main>
  );
}
