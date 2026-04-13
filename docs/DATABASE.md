# Database Design Document — Dr. Osmanov

## Общие сведения

- **СУБД:** PostgreSQL 16
- **ORM:** Prisma 5.x
- **Схема:** одна база `dental_db`, пользователь `dental_user`
- **Кодировка:** UTF-8
- **Часовой пояс:** UTC (конвертация в Europe/Moscow на клиенте)

---

## Таблицы

### 1. User — Пользователи системы

**Назначение:** Хранит всех пользователей (клиенты, сотрудники, владелец). Единая точка аутентификации.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK, default uuid() | Уникальный идентификатор |
| phone | VARCHAR | UNIQUE, NOT NULL | Телефон в формате +7XXXXXXXXXX |
| name | VARCHAR | NOT NULL, default "" | ФИО пользователя |
| role | ENUM(OWNER,STAFF,CLIENT) | NOT NULL, default CLIENT | Роль в системе |
| isActive | BOOLEAN | NOT NULL, default true | Активен ли аккаунт |
| isAnonymized | BOOLEAN | NOT NULL, default false | Анонимизирован (удалён по 152-ФЗ) |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата регистрации |
| updatedAt | TIMESTAMP | NOT NULL, auto | Дата обновления |

**Индексы:**
- `idx_user_phone` — по phone (поиск при OTP)
- `idx_user_role` — по role (фильтрация)

**Связи:**
- 1:0..1 → Staff (один пользователь может быть сотрудником)
- 1:0..1 → Client (один пользователь может быть клиентом)
- 1:N → AuditLog
- 1:N → PushSubscription
- 1:N → RefreshToken

**Ожидаемый объём:** ~500 строк (1 год), ~2000 строк (3 года)

---

### 2. Staff — Профили сотрудников

**Назначение:** Дополнительные данные для пользователей с ролью STAFF.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| userId | UUID | UNIQUE, FK → User.id, CASCADE | Связь с пользователем |
| specialty | VARCHAR | NOT NULL | Специальность (Терапевт, Хирург и т.д.) |
| bio | TEXT | NULL | Описание / стаж |
| photoPath | VARCHAR | NULL | Путь к фото (UUID-имя) |
| salary | FLOAT | NOT NULL, default 0 | Зарплата |
| workSchedule | JSONB | NULL | Расписание работы по дням |
| isActive | BOOLEAN | NOT NULL, default true | Активен ли сотрудник |
| telegramChatId | VARCHAR | NULL | Chat ID для уведомлений |

**Формат workSchedule:**
```json
{
  "mon": { "start": "09:00", "end": "18:00" },
  "tue": { "start": "09:00", "end": "18:00" },
  "wed": null,
  "thu": { "start": "09:00", "end": "18:00" },
  "fri": { "start": "09:00", "end": "16:00" },
  "sat": null,
  "sun": null
}
```

**Индексы:**
- `idx_staff_is_active` — по isActive

**Связи:**
- N:1 → User
- 1:N → Appointment
- 1:N → Document
- 1:N → MedRecord

**Ожидаемый объём:** ~5-10 строк

---

### 3. Client — Профили пациентов

**Назначение:** Дополнительные данные для пользователей с ролью CLIENT.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| userId | UUID | UNIQUE, FK → User.id, CASCADE | Связь с пользователем |
| birthDate | DATE | NULL | Дата рождения |
| address | VARCHAR | NULL | Адрес проживания |
| bonusBalance | FLOAT | NOT NULL, default 0 | Баланс бонусов |
| notes | TEXT | NULL | Заметки администратора |
| allergyNotes | TEXT | NULL | Информация об аллергиях |

**Индексы:**
- `idx_client_user_id` — по userId

**Связи:**
- N:1 → User
- 1:N → Appointment
- 1:N → MedRecord
- 1:N → Document
- 1:N → BonusTransaction

**Ожидаемый объём:** ~500 строк (1 год), ~2000 строк (3 года)

---

### 4. Appointment — Записи на приём

**Назначение:** Центральная сущность — запись пациента к врачу на услугу.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| clientId | UUID | FK → Client.id, NOT NULL | Пациент |
| staffId | UUID | FK → Staff.id, NOT NULL | Врач |
| serviceId | UUID | FK → Service.id, NOT NULL | Услуга |
| startTime | TIMESTAMP | NOT NULL | Начало приёма |
| endTime | TIMESTAMP | NOT NULL | Конец приёма |
| status | ENUM | NOT NULL, default PENDING | Статус записи |
| notes | TEXT | NULL | Заметки пациента |
| reminderSent | BOOLEAN | NOT NULL, default false | Отправлено ли напоминание |
| cancelReason | TEXT | NULL | Причина отмены |
| cancelledAt | TIMESTAMP | NULL | Время отмены |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата создания |
| updatedAt | TIMESTAMP | NOT NULL, auto | Дата обновления |

**Статусы (AppointmentStatus):**
- `PENDING` — ожидает подтверждения
- `CONFIRMED` — подтверждена
- `IN_PROGRESS` — идёт приём
- `COMPLETED` — завершена
- `CANCELLED` — отменена
- `NO_SHOW` — пациент не пришёл

**Индексы:**
- `idx_appointment_client_id` — по clientId
- `idx_appointment_staff_id` — по staffId
- `idx_appointment_start_time` — по startTime (поиск слотов)
- `idx_appointment_status` — по status

**Связи:**
- N:1 → Client
- N:1 → Staff
- N:1 → Service
- 1:0..1 → Payment

**Ожидаемый объём:** ~3000 строк (1 год), ~10000 строк (3 года)

---

### 5. Service — Каталог услуг (прайс-лист)

**Назначение:** Справочник стоматологических услуг с ценами.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| name | VARCHAR | NOT NULL | Название услуги |
| description | TEXT | NULL | Описание |
| price | FLOAT | NOT NULL | Цена в рублях |
| duration | INT | NOT NULL | Длительность в минутах |
| category | VARCHAR | NOT NULL | Категория |
| isActive | BOOLEAN | NOT NULL, default true | Активна ли услуга |
| sortOrder | INT | NOT NULL, default 0 | Порядок сортировки |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата создания |
| updatedAt | TIMESTAMP | NOT NULL, auto | Дата обновления |

**Категории:** Терапия, Хирургия, Гигиена, Ортодонтия, Имплантация, Эстетика

**Индексы:**
- `idx_service_category` — по category
- `idx_service_is_active` — по isActive

**Связи:**
- 1:N → Appointment

**Ожидаемый объём:** ~15-30 строк

---

### 6. MedRecord — Медицинские записи

**Назначение:** Карточка лечения — диагноз, лечение, зубная карта.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| clientId | UUID | FK → Client.id, NOT NULL | Пациент |
| staffId | UUID | FK → Staff.id, NOT NULL | Врач (автор записи) |
| date | TIMESTAMP | NOT NULL, default now() | Дата приёма |
| diagnosis | TEXT | NOT NULL | Диагноз |
| treatment | TEXT | NOT NULL | Проведённое лечение |
| teethMap | JSONB | NULL | Карта зубов (FDI нотация) |
| notes | TEXT | NULL | Дополнительные заметки |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата создания |
| updatedAt | TIMESTAMP | NOT NULL, auto | Дата обновления |

**Формат teethMap:**
```json
{
  "11": "healthy",
  "21": "filled",
  "36": "extracted",
  "46": "crown"
}
```

**Индексы:**
- `idx_medrecord_client_id` — по clientId
- `idx_medrecord_date` — по date

**Связи:**
- N:1 → Client
- N:1 → Staff
- 1:N → Document

**Ожидаемый объём:** ~2000 строк (1 год), ~8000 строк (3 года)

---

### 7. Document — Файлы и документы

**Назначение:** Метаданные загруженных файлов (снимки, фото, договоры).

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| clientId | UUID | FK → Client.id, NULL | Пациент-владелец |
| staffId | UUID | FK → Staff.id, NULL | Загрузивший сотрудник |
| medRecordId | UUID | FK → MedRecord.id, NULL | Связь с мед. записью |
| type | ENUM | NOT NULL | XRAY, PHOTO, CONTRACT, OTHER |
| originalName | VARCHAR | NOT NULL | Оригинальное имя файла (для отображения) |
| storedName | VARCHAR | NOT NULL | UUID-имя на диске |
| mimeType | VARCHAR | NOT NULL | MIME-тип файла |
| size | INT | NOT NULL | Размер в байтах |
| checksum | VARCHAR | NOT NULL | SHA-256 хеш содержимого |
| uploadedAt | TIMESTAMP | NOT NULL, default now() | Дата загрузки |

**Индексы:**
- `idx_document_client_id` — по clientId
- `idx_document_med_record_id` — по medRecordId

**Связи:**
- N:1 → Client (опц.)
- N:1 → Staff (опц.)
- N:1 → MedRecord (опц.)

**Безопасность:** Файлы НЕ доступны через public URL. Только через GET /documents/:id/download с проверкой прав.

**Ожидаемый объём:** ~1000 строк (1 год), ~5000 строк (3 года)

---

### 8. Payment — Оплата

**Назначение:** Информация об оплате за визит.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| appointmentId | UUID | UNIQUE, FK → Appointment.id | Запись (1:1) |
| amount | FLOAT | NOT NULL | Сумма оплаты |
| method | ENUM | NOT NULL | CASH, CARD, BONUS, MIXED |
| status | ENUM | NOT NULL, default PENDING | PENDING, PAID, REFUNDED |
| bonusUsed | FLOAT | NOT NULL, default 0 | Использовано бонусов |
| bonusEarned | FLOAT | NOT NULL, default 0 | Начислено бонусов |
| processedBy | VARCHAR | NOT NULL | ID сотрудника (обработал) |
| receiptNumber | VARCHAR | UNIQUE, default cuid() | Номер чека |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата оплаты |

**Индексы:**
- `idx_payment_status` — по status
- `idx_payment_created_at` — по createdAt (отчёты)

**Связи:**
- 1:1 → Appointment

**Ожидаемый объём:** ~2500 строк (1 год), ~8000 строк (3 года)

---

### 9. BonusTransaction — Движение бонусов

**Назначение:** Лог начислений и списаний бонусных баллов.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| clientId | UUID | FK → Client.id, NOT NULL | Клиент |
| amount | FLOAT | NOT NULL | Сумма (+ начисление, - списание) |
| type | ENUM(EARN,SPEND) | NOT NULL | Тип операции |
| reason | VARCHAR | NOT NULL | Причина ("Оплата приёма", "Использование бонусов") |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата операции |

**Индексы:**
- `idx_bonus_client_id` — по clientId

---

### 10. OtpCode — OTP-коды

**Назначение:** Одноразовые коды для SMS-аутентификации.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| phone | VARCHAR | NOT NULL | Телефон получателя |
| codeHash | VARCHAR | NOT NULL | bcrypt-хеш кода (НЕ plaintext!) |
| expiresAt | TIMESTAMP | NOT NULL | Время истечения (10 мин) |
| used | BOOLEAN | NOT NULL, default false | Использован ли код |
| attempts | INT | NOT NULL, default 0 | Кол-во попыток проверки |
| ipAddress | VARCHAR | NULL | Маскированный IP отправителя |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата создания |

**Индексы:**
- `idx_otp_phone` — по phone
- `idx_otp_expires_at` — по expiresAt

**Безопасность:** Максимум 3 попытки на код, максимум 3 кода на номер в час.

---

### 11. RefreshToken — Refresh-токены

**Назначение:** Хранение хешей refresh-токенов для ротации.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| userId | UUID | FK → User.id, CASCADE | Владелец токена |
| tokenHash | VARCHAR | NOT NULL | bcrypt-хеш токена |
| expiresAt | TIMESTAMP | NOT NULL | Время истечения (30 дней) |
| isRevoked | BOOLEAN | NOT NULL, default false | Отозван ли |
| ipAddress | VARCHAR | NULL | IP при выдаче |
| userAgent | VARCHAR | NULL | User-Agent при выдаче |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата выдачи |

**Индексы:**
- `idx_refresh_user_id` — по userId
- `idx_refresh_token_hash` — по tokenHash

---

### 12. AuditLog — Журнал аудита

**Назначение:** Лог всех мутационных операций для безопасности и аудита.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| userId | UUID | FK → User.id, NOT NULL | Кто выполнил действие |
| action | VARCHAR | NOT NULL | Действие (CREATE_APPOINTMENT и т.д.) |
| entity | VARCHAR | NOT NULL | Сущность (Appointment, Payment...) |
| entityId | UUID | NULL | ID затронутой записи |
| oldValue | JSONB | NULL | Предыдущее состояние |
| newValue | JSONB | NULL | Новое состояние |
| ipAddress | VARCHAR | NULL | Маскированный IP |
| userAgent | VARCHAR | NULL | User-Agent (обрезан до 200 символов) |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата действия |

**Индексы:**
- `idx_audit_user_id` — по userId
- `idx_audit_entity` — по entity
- `idx_audit_created_at` — по createdAt

**Хранение:** 1 год, далее архивация.

**Ожидаемый объём:** ~15000 строк (1 год), ~50000 строк (3 года)

---

### 13. PushSubscription — Push-подписки

**Назначение:** Подписки на Web Push уведомления (VAPID).

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | UUID | PK | Уникальный идентификатор |
| userId | UUID | FK → User.id, CASCADE | Пользователь |
| endpoint | VARCHAR | UNIQUE, NOT NULL | Push endpoint |
| p256dh | VARCHAR | NOT NULL | Ключ шифрования |
| auth | VARCHAR | NOT NULL | Ключ аутентификации |
| userAgent | VARCHAR | NULL | Устройство |
| createdAt | TIMESTAMP | NOT NULL, default now() | Дата подписки |

**Индексы:**
- `idx_push_user_id` — по userId

---

### 14. ClinicSettings — Настройки клиники

**Назначение:** Singleton-запись с глобальными настройками.

| Столбец | Тип | Ограничения | Описание |
|---|---|---|---|
| id | VARCHAR | PK, default "singleton" | Всегда "singleton" |
| name | VARCHAR | NOT NULL, default "Dr. Osmanov" | Название клиники |
| address | VARCHAR | NOT NULL, default "" | Адрес |
| phone | VARCHAR | NOT NULL, default "" | Телефон клиники |
| email | VARCHAR | NOT NULL, default "" | Email |
| bonusPercent | FLOAT | NOT NULL, default 5 | Процент бонусов |
| ownerTelegramId | VARCHAR | NULL | Telegram chat ID владельца |
| updatedAt | TIMESTAMP | NOT NULL, auto | Дата обновления |

---

## Стратегия резервного копирования

| Тип | Частота | Хранение | Метод |
|---|---|---|---|
| Полный бэкап | Ежедневно, 03:00 MSK | 30 дней | `pg_dump` → архив → /backups/ |
| WAL-логи | Непрерывно | 7 дней | `archive_mode = on` |
| Тестовый restore | Еженедельно | - | Проверка целостности на отдельной базе |

**Команда бэкапа:**
```bash
docker compose exec postgres pg_dump -U dental_user dental_db | gzip > /backups/dental_$(date +%Y%m%d_%H%M%S).sql.gz
```

## Миграции

- Управляются через Prisma Migrate
- Каждое изменение схемы — отдельная миграция с именем
- На продакшне: `npx prisma migrate deploy` (без интерактива)
- Откат: через SQL-скрипт отката (Prisma не поддерживает авто-откат)
