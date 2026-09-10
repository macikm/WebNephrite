#!/bin/bash
# setup-host.sh - Inicializační skript pro nasazení WebNephrite na hostingu (/opt/WebNephrite)
set -e

TARGET_DIR="/opt/WebNephrite"
REPO_URL="https://github.com/macikm/WebNephrite.git"
CONTAINER_PORT="8089"

echo "=== [1/4] Příprava adresáře $TARGET_DIR ==="
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

echo "=== [2/4] Klonování Git repozitáře ==="
if [ -d ".git" ]; then
    echo "Repozitář již existuje, stahuji aktuální změny..."
    git pull origin main
else
    git clone "$REPO_URL" .
fi

echo "=== [3/4] Příprava konfiguračního souboru .env ==="
if [ ! -f ".env" ]; then
    cat <<EOF > .env
NODE_ENV=production
PORT=3000
HOST_PORT=$CONTAINER_PORT
HELIOS_API_URL=https://demo-api.helios.eu
HELIOS_SERVER_URL=https://open.helios.eu/DemoNephrite
HELIOS_DB_PROFILE=Demo
HELIOS_LANGUAGE_ID=CZ
EOF
    echo "Vytvořen výchozí soubor .env"
fi

echo "=== [4/4] Nastavení práv pro skripty ==="
chmod +x update.sh setup-host.sh 2>/dev/null || true

echo "=== Kontrola Docker sítě infrastructure_default ==="
if ! docker network ls | grep -q "infrastructure_default"; then
    echo "Vytvářím docker network infrastructure_default..."
    docker network create infrastructure_default
fi

echo ""
echo "=== Spuštění kontejneru ==="
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo ""
echo "🎉 WebNephrite úspěšně nasazen!"
echo "Aplikace běží na portu: $CONTAINER_PORT (připojena k síti infrastructure_default)"
echo "Nakonfigurujte Cloudflare / Nginx proxy pro doménu: webnephrite.martinmacko.cz -> port $CONTAINER_PORT"
