#!/bin/bash
# ═══════════════════════════════════════════════════
#  Dr. Osmanov — Установка на VDS Beget
#  Запуск: bash setup-server.sh
# ═══════════════════════════════════════════════════

set -e

echo ""
echo "════════════════════════════════════════"
echo "  Dr. Osmanov — Настройка сервера"
echo "════════════════════════════════════════"
echo ""

# ── 1. Обновление системы ──────────────────────
echo "[1/8] Обновление системы..."
apt update && apt upgrade -y
apt install -y curl git ufw

# ── 2. Создание пользователя deploy ────────────
echo "[2/8] Создание пользователя deploy..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
    echo "Пользователь deploy создан"
else
    echo "Пользователь deploy уже существует"
fi

# ── 3. Файрвол ─────────────────────────────────
echo "[3/8] Настройка файрвола (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "y" | ufw enable
ufw status

# ── 4. Docker ──────────────────────────────────
echo "[4/8] Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker deploy
    systemctl enable docker
    systemctl start docker
    echo "Docker установлен: $(docker --version)"
else
    echo "Docker уже установлен: $(docker --version)"
fi

# Проверка docker compose
docker compose version

# ── 5. Клонирование проекта ────────────────────
echo "[5/8] Клонирование проекта..."
mkdir -p /opt
cd /opt

if [ -d "drosmanov" ]; then
    echo "Каталог drosmanov уже существует, обновляем..."
    cd drosmanov
    git pull origin claude/dental-clinic-pwa-docs-AJZvi || true
else
    git clone -b claude/dental-clinic-pwa-docs-AJZvi https://github.com/ramxak2025/drosmanov.git
    cd drosmanov
fi

chown -R deploy:deploy /opt/drosmanov

# ── 6. Генерация ключей ───────────────────────
echo "[6/8] Генерация JWT и VAPID ключей..."

# JWT RS256 ключи
if [ ! -f /opt/drosmanov/.jwt-private.pem ]; then
    openssl genrsa -out /opt/drosmanov/.jwt-private.pem 4096 2>/dev/null
    openssl rsa -in /opt/drosmanov/.jwt-private.pem -pubout -out /opt/drosmanov/.jwt-public.pem 2>/dev/null
    echo "JWT ключи сгенерированы"
else
    echo "JWT ключи уже существуют"
fi

JWT_PRIVATE=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' /opt/drosmanov/.jwt-private.pem)
JWT_PUBLIC=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' /opt/drosmanov/.jwt-public.pem)

# Генерация пароля для PostgreSQL
PG_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# ── 7. Создание .env ──────────────────────────
echo "[7/8] Создание .env файла..."

cat > /opt/drosmanov/.env << ENVEOF
# ── Application ──────────────────────────────────
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://185.23.35.240

# ── Database ─────────────────────────────────────
POSTGRES_PASSWORD=${PG_PASSWORD}
DATABASE_URL=postgresql://dental_user:${PG_PASSWORD}@postgres:5432/dental_db

# ── JWT (RS256) ───────────────────────────────────
JWT_PRIVATE_KEY="${JWT_PRIVATE}"
JWT_PUBLIC_KEY="${JWT_PUBLIC}"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# ── SMS.ru (пока не подключено) ───────────────────
SMS_RU_API_ID=not-configured

# ── Web Push (VAPID) ──────────────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@drosmanov.ru
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# ── Telegram ─────────────────────────────────────
TELEGRAM_BOT_TOKEN=

# ── File Uploads ──────────────────────────────────
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=20

# ── Next.js ───────────────────────────────────────
NEXT_PUBLIC_API_URL=http://185.23.35.240/api
NEXT_PUBLIC_APP_NAME=Dr. Osmanov
NEXT_PUBLIC_APP_URL=http://185.23.35.240
ENVEOF

echo ".env файл создан"

# ── 8. Nginx без SSL (пока по IP) ─────────────
echo "[8/8] Настройка Nginx для работы по IP..."

# Создаём упрощённый nginx конфиг (без SSL, по IP)
mkdir -p /opt/drosmanov/nginx/conf.d

cat > /opt/drosmanov/nginx/conf.d/app.conf << 'NGINXEOF'
limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

server {
    listen 80;
    server_name _;

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
    server_tokens off;

    # API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header X-Powered-By;
    }

    # Block direct access to uploads
    location /uploads/ { deny all; }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Next.js frontend
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

echo ""
echo "════════════════════════════════════════"
echo "  Настройка завершена!"
echo "════════════════════════════════════════"
echo ""
echo "  Теперь запустите:"
echo ""
echo "    cd /opt/drosmanov"
echo "    docker compose up -d --build"
echo ""
echo "  После сборки (5-10 минут):"
echo ""
echo "    docker compose exec api npx prisma migrate deploy"
echo "    docker compose exec api npx prisma db seed"
echo ""
echo "  Сайт будет доступен: http://185.23.35.240"
echo ""
echo "  Пароль PostgreSQL: ${PG_PASSWORD}"
echo "  (сохранён в /opt/drosmanov/.env)"
echo ""
echo "════════════════════════════════════════"
echo ""
