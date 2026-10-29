#!/bin/bash
# update.sh - Skript pro bleskovou aktualizaci WebNephrite stažením předpřipraveného Docker image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Kontroluji a stahuji nejnovější kód z Git repozitáře..."
git pull origin main

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Stahuji předpřipravený Docker image z GitHub Packages..."
if command -v docker-compose &> /dev/null; then
    docker-compose pull
    docker-compose up -d
else
    docker compose pull
    docker compose up -d
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 Promazávám staré nepoužívané image..."
docker image prune -f

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🎉 Aktualizace úspěšně dokončena!"
