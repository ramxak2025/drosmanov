#!/bin/bash
# ═══════════════════════════════════════════════════
#  БЫСТРЫЙ ДЕПЛОЙ
#  Запуск: bash redeploy.sh
#  Для полной пересборки без кеша: bash redeploy.sh --full
# ═══════════════════════════════════════════════════
set -e
cd /opt/drosmanov

FULL=0
if [ "$1" = "--full" ] || [ "$1" = "-f" ]; then
  FULL=1
fi

echo ""
echo "════════════════════════════════════════"
if [ "$FULL" = "1" ]; then
  echo "  Полная пересборка (без кеша)"
else
  echo "  Быстрый деплой (с кешем Docker)"
fi
echo "════════════════════════════════════════"
echo ""

echo "[1/4] git pull..."
git fetch origin claude/dental-clinic-pwa-docs-AJZvi
git reset --hard origin/claude/dental-clinic-pwa-docs-AJZvi
echo "  → $(git log --oneline -1)"
echo ""

echo "[2/4] Сборка..."
if [ "$FULL" = "1" ]; then
  docker compose build --no-cache api web
else
  # Быстрая сборка — Docker переиспользует слои с node_modules
  # Пересборка запустится только если изменились файлы
  docker compose build api web
fi
echo ""

echo "[3/4] Запуск (миграции применятся автоматически)..."
docker compose up -d
echo ""

echo "[4/4] Ожидание старта (10 сек)..."
sleep 10
echo ""

echo "════════════════════════════════════════"
echo "  Версия на сервере:"
BUILD_ID=$(curl -s https://stoma.web-kultura.ru/api/health 2>/dev/null | grep -o '"buildId":"[^"]*"' || echo "(API не отвечает)")
echo "  $BUILD_ID"
echo "════════════════════════════════════════"
docker compose ps
