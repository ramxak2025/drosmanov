#!/bin/bash
# ═══════════════════════════════════════════════════
#  Dr. Osmanov — Установка на VDS
#  Домен: stoma.web-kultura.ru
#  Запуск: bash setup-server.sh
# ═══════════════════════════════════════════════════

set -e

DOMAIN="stoma.web-kultura.ru"

echo ""
echo "════════════════════════════════════════"
echo "  Dr. Osmanov — Настройка сервера"
echo "  Домен: ${DOMAIN}"
echo "════════════════════════════════════════"
echo ""

# ── 1. Обновление системы ──────────────────────
echo "[1/9] Обновление системы..."
apt update && apt upgrade -y
apt install -y curl git ufw certbot

# ── 2. Создание пользователя deploy ────────────
echo "[2/9] Создание пользователя deploy..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
    echo "Пользователь deploy создан"
else
    echo "Пользователь deploy уже существует"
fi

# ── 3. Файрвол ─────────────────────────────────
echo "[3/9] Настройка файрвола (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ufw status

# ── 4. Docker ──────────────────────────────────
echo "[4/9] Установка Docker..."
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

docker compose version

# ── 5. Клонирование проекта ────────────────────
echo "[5/9] Клонирование проекта..."
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

# ── 6. SSL сертификат ──────────────────────────
echo "[6/9] Получение SSL сертификата..."
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    certbot certonly --standalone -d ${DOMAIN} --non-interactive --agree-tos --email admin@web-kultura.ru
    echo "SSL сертификат получен"
else
    echo "SSL сертификат уже существует"
fi

# Автообновление SSL
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f /opt/drosmanov/docker-compose.yml restart nginx'") | sort -u | crontab -

# ── 7. Генерация ключей ───────────────────────
echo "[7/9] Генерация JWT ключей..."

if [ ! -f /opt/drosmanov/.jwt-private.pem ]; then
    openssl genrsa -out /opt/drosmanov/.jwt-private.pem 4096 2>/dev/null
    openssl rsa -in /opt/drosmanov/.jwt-private.pem -pubout -out /opt/drosmanov/.jwt-public.pem 2>/dev/null
    echo "JWT ключи сгенерированы"
else
    echo "JWT ключи уже существуют"
fi

JWT_PRIVATE=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' /opt/drosmanov/.jwt-private.pem)
JWT_PUBLIC=$(awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' /opt/drosmanov/.jwt-public.pem)

PG_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# ── 8. Создание .env ──────────────────────────
echo "[8/9] Создание .env файла..."

cat > /opt/drosmanov/.env << ENVEOF
# ── Application ──────────────────────────────────
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://${DOMAIN}

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
VAPID_SUBJECT=mailto:admin@web-kultura.ru
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# ── Telegram ─────────────────────────────────────
TELEGRAM_BOT_TOKEN=

# ── File Uploads ──────────────────────────────────
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=20

# ── Next.js ───────────────────────────────────────
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api
NEXT_PUBLIC_APP_NAME=Dr. Osmanov
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
ENVEOF

echo ".env файл создан"

# ── 9. Nginx с SSL ─────────────────────────────
echo "[9/9] Настройка Nginx с SSL..."

mkdir -p /opt/drosmanov/nginx/conf.d

cat > /opt/drosmanov/nginx/conf.d/app.conf << NGINXEOF
limit_req_zone \$binary_remote_addr zone=otp:10m rate=3r/m;
limit_req_zone \$binary_remote_addr zone=api:10m rate=60r/m;

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    server_tokens off;

    # API
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        location /api/auth/login {
            limit_req zone=otp burst=5 nodelay;
            proxy_pass http://api:3001;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        proxy_pass http://api:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_hide_header X-Powered-By;
        client_max_body_size 20M;
    }

    # Block direct access to uploads
    location /uploads/ { deny all; }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    # Next.js frontend
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

echo ""
echo "════════════════════════════════════════════"
echo "  Настройка завершена!"
echo "════════════════════════════════════════════"
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
echo "  Сайт: https://${DOMAIN}"
echo ""
echo "  Тестовые аккаунты:"
echo "  Владелец: +79001234567 / owner123"
echo "  Терапевт: +79007654321 / staff111"
echo "  Пациент:  +79001111111 / client123"
echo ""
echo "  Пароль PostgreSQL: ${PG_PASSWORD}"
echo "════════════════════════════════════════════"
echo ""
