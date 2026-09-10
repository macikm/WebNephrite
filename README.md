# WebNephrite ERP 🌐💼

Moderní, rychlé a responzivní webové rozhraní (ERP) postavené nad podnikovým systémem **Helios Nephrite** s využitím oficiálního **Web.API (ServiceGate)**.

Aplikace poskytuje ucelené řešení pro každodenní správu firmy – od financí, přes skladové hospodářství a objednávky, až po adresář partnerů, realizaci zakázek a DMS dokumenty.

---

## 🚀 Hlavní moduly a funkce

- 📊 **Systémový Dashboard & KPI:**
  - Okamžitý přehled o neuhrazených pohledávkách a závazcích.
  - Sledování celkového obratu a počtu aktivních skladových položek.
  - Přehled posledních vystavených faktur s indikací stavu úhrady.
  - Rychlá navigace a indikátor stavu spojení s Helios serverem.

- 🧾 **Faktury vydané a přijaté:**
  - Kompletní evidence vydaných i přijatých faktur.
  - Filtrování podle stavu úhrady (*Uhrazeno*, *Neuhrazeno / Po splatnosti*) a fulltextové vyhledávání (číslo faktury, variabilní symbol, název klienta).
  - Přehledný detail dokladu: rozpad částek, DUZP, splatnost, bankovní spojení, vazba na středisko a zakázku.

- 📦 **Produkty & Skladový katalog:**
  - Přehled zboží a služeb, měrné jednotky (`ks`, `hod`, apod.), sazby DPH.
  - Vyhledávání podle názvu, referenčního čísla nebo čárového kódu (EAN).
  - Detailní katalogová karta položky.

- 🛒 **Správa objednávek:**
  - Evidence přijatých i vydaných objednávek.
  - Sledování stavu zpracování, termínů dodání a částek.

- 👥 **Adresář zákazníků a partnerů (CRM):**
  - Přehled odběratelů a dodavatelů, IČO, DIČ, sídlo firmy.
  - Rychlé proklikové kontakty na telefon a e-mail.

- 💼 **Zakázky a plnění úkolů:**
  - Sledování projektů/zakázek, zahájení a termínů ukončení.
  - Evidence jednotlivých úkolů, plánovaných a vykázaných hodin.

- 📁 **Správa dokumentů DMS:**
  - Elektronický archiv smluv, externích dokladů a příloh.

- 🛠️ **Systémová diagnostika & Interaktivní API konzole:**
  - Informace o přihlášeném uživateli, databázovém profilu a instanci Heliosu.
  - Možnost interaktivně odesílat GET požadavky na libovolný endpoint Helios API a prohlížet surové JSON odpovědi přímo v aplikaci.
  - Přímý odkaz na oficiální Swagger dokumentaci.

---

## 🔒 Autentizace a bezpečnost

Aplikace využívá bezpečný **BFF (Backend-For-Frontend)** vzor:
1. Uživatel zadá své jméno a heslo (v demu předvyplněno `tester` / `tester`) a zvolí databázový profil (`Demo`).
2. Serverová část aplikace odešle požadavek na `/api/connect/login` Helios Web.API.
3. Obdržené `userId` se bezpečně uloží do šifrované `httpOnly` cookie relace.
4. Klientský prohlížeč nikdy nevystavuje citlivé klíče – veškerá komunikace s Helios API probíhá přes zabezpečenou serverovou proxy `/api/helios/*`, která automaticky doplňuje hlavičku `Authorization: Basic <credentials>`.

---

## 🛠️ Použité technologie

- **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling:** Vanilla CSS Design System s glassmorphismem, moderní typografií (*Plus Jakarta Sans*, *JetBrains Mono*) a dark mode paletou.
- **Ikony:** [Lucide React](https://lucide.dev/)
- **Kontejnerizace:** Docker (Multi-stage build na bázi `node:20-alpine`, Next.js `standalone` výstup pro minimální spotřebu RAM ~70 MB).

---

## 🐳 Nasazení na server (Proxmox / Docker)

Aplikace je připravena pro provoz v Dockeru v adresáři `/opt/WebNephrite`, napojena na existující síť `infrastructure_default` a vystavena na portu **`8089`**.

### 1. Prvotní instalace na hostingu
Na serveru spusťte inicializační skript (případně zkopírujte a spusťte `setup-host.sh`):

```bash
# Vytvoření adresáře a stažení projektu
mkdir -p /opt/WebNephrite
cd /opt/WebNephrite
git clone https://github.com/macikm/WebNephrite.git .

# Udělení práv a spuštění
chmod +x setup-host.sh update.sh
./setup-host.sh
```

Skript automaticky:
- Naklonuje repozitář
- Vytvoří výchozí `.env` soubor
- Zkontroluje síť `infrastructure_default`
- Sestaví a nastartuje kontejner na portu `8089`

### 2. Automatická aktualizace z Gitu (`update.sh`)
Pro aktualizaci kontejneru na nejnovější verzi z repozitáře stačí v `/opt/WebNephrite` spustit:

```bash
./update.sh
```

Tento skript zkontroluje změny na větvi `main`. Pokud zjistí nový kód, provede `git pull` a automaticky rebuilduje kontejner (`docker compose up -d --build`).

Lze jej přidat i do cronu pro periodickou kontrolu:
```bash
# Kontrola každou hodinu
0 * * * * /opt/WebNephrite/update.sh >> /var/log/webnephrite-update.log 2>&1
```

---

## ⚙️ Konfigurace proměnných prostředí (`.env`)

| Proměnná | Výchozí hodnota | Popis |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Běhové prostředí |
| `PORT` | `3000` | Interní port v kontejneru |
| `HOST_PORT` | `8089` | Port vystavený na hostiteli |
| `HELIOS_API_URL` | `https://demo-api.helios.eu` | Základní URL pro Helios Web.API |
| `HELIOS_SERVER_URL` | `https://open.helios.eu/DemoNephrite` | URL aplikačního serveru Noris |
| `HELIOS_DB_PROFILE` | `Demo` | Výchozí databázový profil |
| `HELIOS_LANGUAGE_ID` | `CZ` | Jazyk komunikace |

---

## 🌐 Propojení s Cloudflare & Nginx

Ve vaší administraci (např. Nginx Proxy Manager nebo Cloudflare Tunnel) nasměrujte doménu:

- **Doména:** `webnephrite.martinmacko.cz`
- **Cíl (Forward Hostname / IP):** IP vašeho hostingu nebo jméno kontejneru v síti `infrastructure_default`: `webnephrite`
- **Port:** `3000` (při interním směrování v síti) nebo `8089` (při směrování na hostitele)
- **SSL / Websockets:** Povoleno

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

Aplikace bude dostupná na `http://localhost:3000`.

---

## 📄 Licence
Projekt je vyvíjen pro soukromé a podnikové účely v souladu se specifikací Helios Nephrite Web.API.
