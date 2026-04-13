# Deployment Guide — Dr. Osmanov

## 1. Требования к серверу

| Параметр | Минимум | Рекомендовано |
|---|---|---|
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 ядра | 4 ядра |
| RAM | 2 ГБ | 4 ГБ |
| Диск | 20 ГБ SSD | 40 ГБ SSD |
| Хостинг | Beget VDS | Beget VDS |

**Необходимое ПО:**
- Docker 24+
- Docker Compose v2
- Git
- Certbot (для SSL)

---

## 2. Первоначальная настройка сервера

### 2.1 Создание пользователя
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 2.2 Настройка SSH (только ключи)
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Скопировать публичный ключ в ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Отключить вход по паролю
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2.3 Настройка файрвола (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 2.4 Установка Docker
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker deploy
newgrp docker

# Проверка
docker --version
docker compose version
```

---

## 3. Клонирование и настройка проекта

### 3.1 Клонирование
```bash
cd /opt
sudo mkdir drosmanov
sudo chown deploy:deploy drosmanov
git clone <repository-url> drosmanov
cd drosmanov
```

### 3.2 Настройка переменных окружения
```bash
cp .env.example .env
nano .env
# Заполнить ВСЕ значения — см. комментарии в .env.example
```

### 3.3 Генерация RS256 ключей для JWT
```bash
# Генерация приватного ключа (4096 бит)
openssl genrsa -out jwt-private.pem 4096

# Извлечение публичного ключа
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Скопировать содержимое в .env (с заменой переносов на \n)
awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' jwt-private.pem
# Вставить результат в JWT_PRIVATE_KEY="..."

awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' jwt-public.pem
# Вставить результат в JWT_PUBLIC_KEY="..."

# Удалить файлы ключей (они теперь в .env)
rm jwt-private.pem jwt-public.pem
```

### 3.4 Генерация VAPID ключей для Web Push
```bash
npx web-push generate-vapid-keys
# Скопировать Public Key в VAPID_PUBLIC_KEY и NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Скопировать Private Key в VAPID_PRIVATE_KEY
```

---

## 4. Первый запуск

### 4.1 Сборка и запуск
```bash
docker compose up -d --build
```

### 4.2 Применение миграций
```bash
docker compose exec api npx prisma migrate deploy
```

### 4.3 Заполнение начальными данными
```bash
docker compose exec api npx prisma db seed
```

### 4.4 Проверка работоспособности
```bash
# Проверка контейнеров
docker compose ps

# Проверка health endpoint
curl http://localhost/api/health
# Ожидаемый ответ: { "status": "ok" }

# Проверка логов
docker compose logs -f api
docker compose logs -f web
```

---

## 5. Настройка SSL (Let's Encrypt)

### 5.1 Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Получение сертификата
```bash
# Временно остановить nginx контейнер
docker compose stop nginx

# Получить сертификат
sudo certbot certonly --standalone -d yourdomain.ru

# Перезапустить nginx
docker compose start nginx
```

### 5.3 Обновление nginx конфигурации
В `nginx/conf.d/app.conf` обновить пути к сертификатам:
```nginx
ssl_certificate     /etc/letsencrypt/live/yourdomain.ru/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.ru/privkey.pem;
```

### 5.4 Автоматическое обновление сертификата
```bash
# Добавить cron-задачу
sudo crontab -e
# Добавить строку:
0 3 * * * certbot renew --quiet && docker compose -f /opt/drosmanov/docker-compose.yml restart nginx
```

---

## 6. Обслуживание

### 6.1 Просмотр логов
```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f nginx
```

### 6.2 Резервное копирование базы данных
```bash
# Ручной бэкап
docker compose exec postgres pg_dump -U dental_user dental_db > backup_$(date +%Y%m%d).sql

# Сжатый бэкап
docker compose exec postgres pg_dump -U dental_user dental_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 6.3 Восстановление из бэкапа
```bash
# Остановить API
docker compose stop api web

# Восстановить
cat backup_20240315.sql | docker compose exec -T postgres psql -U dental_user dental_db

# Запустить API
docker compose start api web
```

### 6.4 Обновление приложения
```bash
cd /opt/drosmanov
git pull origin main
docker compose up -d --build

# Если есть новые миграции
docker compose exec api npx prisma migrate deploy
```

### 6.5 Автоматический бэкап (cron)
```bash
sudo crontab -e
# Добавить:
0 3 * * * cd /opt/drosmanov && docker compose exec -T postgres pg_dump -U dental_user dental_db | gzip > /opt/backups/dental_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz

# Удаление бэкапов старше 30 дней
0 4 * * * find /opt/backups -name "dental_*.sql.gz" -mtime +30 -delete
```

---

## 7. Мониторинг

### 7.1 Health check
```bash
# Проверка API
curl -s https://yourdomain.ru/api/health | jq .

# Проверка контейнеров
docker compose ps
```

### 7.2 Использование ресурсов
```bash
docker stats --no-stream
```

### 7.3 Место на диске
```bash
# Общее
df -h

# Docker
docker system df

# Очистка неиспользуемых образов
docker system prune -f
```

---

## 8. Устранение неполадок

### API не запускается
```bash
# Проверить логи
docker compose logs api

# Проверить переменные окружения
docker compose exec api env | grep -E "(DATABASE|JWT|PORT)"

# Проверить подключение к БД
docker compose exec api npx prisma db execute --stdin <<< "SELECT 1"
```

### База данных не доступна
```bash
# Проверить здоровье контейнера
docker compose ps postgres

# Проверить логи
docker compose logs postgres

# Подключиться напрямую
docker compose exec postgres psql -U dental_user dental_db
```

### Nginx возвращает 502
```bash
# Проверить, работают ли backend-сервисы
docker compose ps api web

# Проверить логи nginx
docker compose logs nginx

# Проверить сеть между контейнерами
docker compose exec nginx ping api
docker compose exec nginx ping web
```

---

## 9. Структура Docker-контейнеров

```
┌─────────────────────────────────────────┐
│         docker compose                  │
│                                         │
│  ┌─────────┐  ┌────────┐  ┌─────────┐ │
│  │  nginx   │  │  api   │  │  web    │ │
│  │ :80,:443 │  │ :3001  │  │ :3000   │ │
│  └────┬─────┘  └───┬────┘  └───┬─────┘ │
│       │            │           │        │
│  external      internal    internal     │
│  network       network    network       │
│                    │                    │
│              ┌─────┴─────┐              │
│              │ postgres  │              │
│              │   :5432   │              │
│              └───────────┘              │
│                                         │
│  Volumes:                               │
│  - pgdata (данные PostgreSQL)           │
│  - uploads (загруженные файлы)          │
│  - certbot-www (SSL verification)       │
└─────────────────────────────────────────┘
```
