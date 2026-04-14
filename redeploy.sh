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

echo "[1/6] Git pull..."
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

echo "[6/6] Ожидание 15 секунд и проверка..."
sleep 15
echo ""

echo "════════════════════════════════════════"
echo "  BUILD-ID на сервере:"
curl -s https://stoma.web-kultura.ru/api/health | grep -o '"buildId":"[^"]*"' || echo "  (не получен)"
echo ""
echo "════════════════════════════════════════"
echo ""
echo "  Проверить можно здесь:"
echo "  https://stoma.web-kultura.ru/api/health"
echo ""
echo "  buildId должен быть: 2026-04-14-doctors-bonuses-v2"
echo ""
echo "════════════════════════════════════════"

docker compose ps
