# WebNephrite ERP & MCP Server 🌐💼🤖

Moderní, rychlé a responzivní webové rozhraní (ERP) a **plnohodnotný MCP Server** postavený nad podnikovým informačním systémem **Helios Nephrite** s využitím oficiálního **Web.API (ServiceGate)**.

Aplikace poskytuje ucelené řešení pro každodenní správu firmy – od financí a fakturace, přes sklad a objednávky, až po CRM adresář partnerů, zakázky a DMS dokumenty – a zároveň umožňuje napojení moderních AI agentů přes **Model Context Protocol (MCP)**.

---

## 🤖 MCP Server (Model Context Protocol)

WebNephrite v sobě obsahuje nativně integrovaný webový **MCP Server** běžící přímo na endpointu:
👉 **`/api/mcp`** (např. `https://webnephrite.martinmacko.cz/api/mcp`)

Server splňuje oficiální specifikaci MCP pro **Streamable HTTP / SSE transport**, má povolené kompletní **CORS hlavičky** a umožňuje AI asistentům (jako je **Claude Desktop**, **Cursor**, **Antigravity**, **Gemini CLI**, **n8n** nebo externí firemní boti) bezpečně pracovat s daty Helios Nephrite.

### 🔌 Konfigurace pro AI klienty

Do konfiguračního souboru vašeho klienta (např. `claude_desktop_config.json`, `.gemini/settings.json` nebo konfigurace v Cursoru) přidejte:

```json
{
  "mcpServers": {
    "webnephrite": {
      "url": "https://webnephrite.martinmacko.cz/api/mcp",
      "headers": {
        "X-Helios-User": "vase_jmeno",
        "X-Helios-Password": "vase_heslo"
      }
    }
  }
}
```

> **Poznámka:** Volitelně lze v hlavičkách předat i `X-Helios-Url` pro přepsání cílového serveru Heliosu. Pokud hlavičky nezadáte, server použije výchozí systémový účet z `.env` proměnných (`HELIOS_USER` / `HELIOS_PASSWORD`).

### 🛡️ Chytrá autentizace & Self-Healing relace
* **Automatický Login Handshake:** Klient posílá pouze standardní jméno a heslo. WebNephrite na pozadí sám provede přihlášení přes `/api/connect/login`, vyzvedne jedinečný bezpečnostní klíč `UserId` a s ním autorizuje volání do Heliosu.
* **Automatická obnova relace (401 Auto-Retry):** Pokud platnost session klíče na straně Heliosu po době nečinnosti vyprší, MCP server to sám detekuje, bez přerušení spojení provede nový login a dotaz automaticky zopakuje. Není potřeba žádný restart serveru ani zásah uživatele.
* **Kompaktní odpovědi:** Nástroje jsou optimalizovány tak, aby v chatech nezahlcovaly konverzaci zbytečným surovým JSONem. Vracejí souhrny (`totalCount`) a čistý náhled prvních položek.

---

## 🛠️ Seznam dostupných MCP nástrojů (30 Tools)

| Oblast | Nástroj (Tool) | Popis a parametry |
| :--- | :--- | :--- |
| **Manažerský přehled** | `helios_get_dashboard_summary` | Rychlý přehled: celkové pohledávky a závazky, neuhrazené faktury po splatnosti a počet otevřených zakázek. |
| **Zákazníci & Partneři** | `helios_search_customers` | Hledání firem podle názvu, IČO, DIČ nebo města přes rychlý Generic Browse 12. |
| | `helios_get_customer_detail` | Kompletní detail firmy/partnera podle ID. |
| | `helios_create_customer` | Založení nové společnosti v číselníku (název, IČO, DIČ, sídlo, kontakty). |
| **Faktury vydané** | `helios_list_invoices_issued` | Seznam vydaných faktur s filtry (`unpaidOnly`, `customerName`, `top`, `skip`). |
| | `helios_get_invoice_issued` | Detail vydané faktury včetně všech položek, částek a odběratele. |
| | `helios_create_invoice_issued` | Vystavení nové vydané faktury včetně položek, sazeb DPH a splatnosti. |
| | `helios_update_invoice_issued` | Úprava existující vydané faktury. |
| | `helios_delete_invoice_issued` | Smazání vydané faktury podle ID. |
| **Faktury přijaté** | `helios_list_invoices_received` | Přehled přijatých faktur od dodavatelů s možností filtrovat neuhrazené. |
| | `helios_get_invoice_received` | Detail přijaté faktury podle ID. |
| | `helios_create_invoice_received` | Zaevidování nové přijaté faktury od dodavatele. |
| **Objednávky** | `helios_list_orders_received` | Seznam přijatých objednávek od zákazníků. |
| | `helios_get_order_received` | Detail přijaté objednávky včetně položek a termínů. |
| | `helios_create_order_received` | Vytvoření nové přijaté objednávky. |
| | `helios_list_orders_issued` | Seznam vydaných objednávek dodavatelům. |
| | `helios_get_order_issued` | Detail vydané objednávky včetně položek. |
| **Kontaktní osoby** | `helios_list_contacts` | Adresář kontaktů s vyhledáváním dle jména nebo vazby na firmu (`companyId`). |
| | `helios_create_contact` | Vytvoření kontaktu (jméno, e-mail, telefon, pozice, vazba na firmu). |
| **Produkty & Sklad** | `helios_list_products` | Vyhledání zboží a služeb dle názvu, kódu nebo ceníku. |
| | `helios_get_product_detail` | Detail produktu / skladové karty podle ID. |
| **Zakázky & Úkoly** | `helios_list_job_orders` | Přehled zakázek v Helios Nephrite včetně rozpočtu a zákazníka. |
| | `helios_get_job_order_detail` | Detail zakázky včetně kalkulací a položek. |
| | `helios_create_job_order` | Založení nové zakázky v systému. |
| | `helios_list_job_tasks` | Seznam úkolů k zakázkám s filtrem na řešitele nebo zakázku. |
| | `helios_create_job_task` | Vytvoření úkolu k zakázce s plánovaným časem a termínem. |
| **DMS Dokumenty** | `helios_list_documents` | Vyhledání smluv a evidovaných příloh v archivu DMS. |
| | `helios_get_document` | Detail dokumentu s možností stažení plného Base64 obsahu. |
| **100% Generic Pass-Through** | `helios_browse_query` | Univerzální volání `v1/Generic/browse/{classId}` pro jakoukoliv třídu v Heliosu (např. 12 = organizace, banky, sklady). |
| | `helios_raw_api_call` | Přímé volání libovolného REST endpointu (`GET`, `POST`, `PUT`, `DELETE`). |

---

## 🚀 Hlavní moduly webové aplikace

- 📊 **Systémový Dashboard & KPI:**
  - Okamžitý přehled o neuhrazených pohledávkách a závazcích.
  - Sledování celkového obratu a počtu aktivních skladových položek.
  - Přehled posledních vystavených faktur s indikací stavu úhrady.
  - Rychlá navigace a indikátor stavu spojení s Helios serverem.

- 🧾 **Faktury vydané a přijaté:**
  - Kompletní evidence vydaných i přijatých faktur.
  - Filtrování podle stavu úhrady (*Uhrazeno*, *Neuhrazeno / Po splatnosti*) a fulltextové vyhledávání.
  - Detail dokladu: rozpad částek, DUZP, splatnost, bankovní spojení, vazba na zakázku.

- 📦 **Produkty & Skladový katalog:**
  - Přehled zboží a služeb, měrné jednotky (`ks`, `hod`, apod.), sazby DPH.
  - Vyhledávání podle názvu, referenčního čísla nebo čárového kódu (EAN).

- 🛒 **Správa objednávek:**
  - Evidence přijatých i vydaných objednávek se sledováním termínů a stavů.

- 👥 **Adresář partnerů a kontaktů (CRM):**
  - **Firmy:** Přehled odběratelů a dodavatelů, IČO, DIČ, sídlo.
  - **Kontakty:** Evidence kontaktních osob, pracovní pozice, přímé volání na telefon a e-mail.

- 💼 **Zakázky a plnění úkolů:**
  - Sledování projektů a zakázek, plánovaných rozpočtů a termínů.
  - Evidence jednotlivých úkolů a vykazování hodin.

- 📁 **Správa dokumentů DMS s pokročilým náhledem:**
  - Integrovaný celoobrazovkový prohlížeč PDF s automatickým přizpůsobením šířce stránky (`FitH`), tiskem a stahováním.
  - Fallback karty pro technické výkresy (CAD), tabulky i archivy.

- 🛠️ **Systémová diagnostika & Interaktivní API konzole:**
  - Informace o instanci Heliosu a databázovém profilu.
  - Možnost odesílat GET požadavky na libovolný endpoint Helios API s automatickým přesměrováním `/api/v1/*` ➔ `/api/helios/v1/*`.

---

## 🔒 Autentizace a bezpečnost

Aplikace využívá bezpečný **BFF (Backend-For-Frontend)** vzor:
1. Uživatel zadá své jméno a heslo (v demu `tester` / `tester`) a zvolí profil (`Demo`).
2. Serverová část aplikace odešle požadavek na `/api/connect/login` Helios Web.API.
3. Obdržený bezpečnostní klíč `userId` se bezpečně uloží do šifrované `httpOnly` cookie relace.
4. Klientský prohlížeč nikdy nevystavuje citlivé klíče – veškerá komunikace s Helios API probíhá přes zabezpečenou serverovou proxy `/api/helios/*`.

---

## 🐳 Nasazení na server (Proxmox / Docker / CI-CD)

Projekt je plně automatizován pomocí **GitHub Actions** a registru **GitHub Packages (GHCR)**.

### Automatický build v cloudu (CI/CD)
Při každém nahrání kódu (`git push`) do větve `main` GitHub na svých serverech automaticky sestaví optimalizovaný Docker image a publikuje jej do:
👉 `ghcr.io/macikm/webnephrite:latest`

### Blesková aktualizace na serveru (`update.sh`)
Na vašem serveru v `/opt/WebNephrite` již **neprobíhá žádná náročná kompilace**, která by vytěžovala procesor nebo paměť:

```bash
./update.sh
```

Skript provede:
1. `git pull origin main`
2. `docker compose pull` (stáhne hotový zkomprimovaný image z GitHubu)
3. `docker compose up -d` (okamžitě restartuje kontejner)
4. `docker image prune -f`

Celá aktualizace trvá **cca 3 až 5 vteřin**, nezpůsobuje zátěž CPU na Proxmoxu a **neshodí Cloudflare tunel**.

---

## ⚙️ Konfigurace proměnných prostředí (`.env`)

| Proměnná | Výchozí hodnota | Popis |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Běhové prostředí |
| `PORT` | `3000` | Interní port v kontejneru |
| `HOST_PORT` | `8089` | Port vystavený na hostiteli v síti `infrastructure_default` |
| `HELIOS_API_URL` | `https://demo-api.helios.eu` | Základní URL pro Helios Web.API |
| `HELIOS_SERVER_URL` | `https://open.helios.eu/DemoNephrite` | URL aplikačního serveru Noris |
| `HELIOS_DB_PROFILE` | `Demo` | Výchozí databázový profil |
| `HELIOS_LANGUAGE_ID` | `CZ` | Jazyk komunikace |

---

## 💻 Lokální vývoj

```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev

# Sestavení produkčního balíčku
npm run build
```

Aplikace běží na `http://localhost:3000`. MCP server je dostupný na `http://localhost:3000/api/mcp`.

---

## 📄 Licence
Projekt je vyvíjen pro soukromé a podnikové účely v souladu se specifikací Helios Nephrite Web.API a Model Context Protocol.
