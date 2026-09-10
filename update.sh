#!/bin/bash
# update.sh - Skript pro kontrolu nového kódu z Git repozitáře a automatickou aktualizaci Docker kontejneru WebNephrite

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Kontroluji aktualizace z Git repozitáře..."

# Stáhnout informace o změnách na origin/main
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Repozitář je aktuální. Žádné nové změny."
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Zjištěna nová verze na Gitu. Aktualizuji..."
    git pull origin main

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🛠️ Rebuilduji a restartuji Docker kontejner WebNephrite..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🎉 Aktualizace úspěšně dokončena!"
fi
