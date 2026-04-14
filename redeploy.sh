#!/bin/bash
# ═══════════════════════════════════════════════════
#  ПОЛНАЯ ПЕРЕСБОРКА И ДЕПЛОЙ
#  Запуск: bash redeploy.sh
# ═══════════════════════════════════════════════════
set -e
cd /opt/drosmanov

echo ""
echo "════════════════════════════════════════"
echo "  Полный redeploy приложения"
echo "════════════════════════════════════════"
echo ""

echo "[1/6] Синхронизация с git (hard reset)..."
git fetch origin claude/dental-clinic-pwa-docs-AJZvi
git reset --hard origin/claude/dental-clinic-pwa-docs-AJZvi
echo "  → HEAD: $(git log --oneline -1)"
echo ""

echo "[2/6] Остановка контейнеров..."
docker compose down
echo ""

echo "[3/6] Удаление старых образов..."
docker rmi drosmanov-api drosmanov-web 2>/dev/null || true
docker builder prune -f
echo ""

echo "[4/6] Сборка api и web БЕЗ кеша..."
docker compose build --no-cache api web
echo ""

echo "[5/6] Запуск..."
docker compose up -d
echo ""

echo "[6/6] Ожидание 20 секунд..."
sleep 20
echo ""

echo "════════════════════════════════════════"
echo "  BUILD-ID на сервере:"
curl -s https://stoma.web-kultura.ru/api/health 2>/dev/null | grep -o '"buildId":"[^"]*"' || echo "  (API не отвечает)"
echo ""
echo "════════════════════════════════════════"
echo ""

docker compose ps
