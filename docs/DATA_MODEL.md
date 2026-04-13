# Data Model — Dr. Osmanov

## Диаграмма связей сущностей (ER)

```
┌──────────────────┐
│      User        │
│──────────────────│
│ id          UUID │─────────────────────────────────┐
│ phone    VARCHAR │                                  │
│ name     VARCHAR │         ┌────────────────────┐   │
│ role        ENUM │────┐    │  RefreshToken       │   │
│ isActive    BOOL │    │    │────────────────────│   │
│ isAnonymized BOOL│    │    │ id            UUID │   │
│ createdAt   TIME │    │    │ userId    FK → User │───┤
│ updatedAt   TIME │    │    │ tokenHash  VARCHAR │   │
└────────┬─────────┘    │    │ expiresAt     TIME │   │
         │              │    │ isRevoked     BOOL │   │
         │              │    └────────────────────┘   │
    ┌────┴────┐         │                             │
    │         │         │    ┌────────────────────┐   │
    ▼         ▼         │    │  PushSubscription  │   │
┌────────┐ ┌────────┐   │    │────────────────────│   │
│ Staff  │ │ Client │   │    │ id            UUID │   │
│────────│ │────────│   │    │ userId    FK → User │───┤
│ id     │ │ id     │   │    │ endpoint   VARCHAR │   │
│ userId │ │ userId │   │    │ p256dh     VARCHAR │   │
│ spec.  │ │ birth  │   │    │ auth       VARCHAR │   │
│ bio    │ │ addr.  │   │    └────────────────────┘   │
│ photo  │ │ bonus  │   │                             │
│ salary │ │ notes  │   │    ┌────────────────────┐   │
│ sched. │ │ allergy│   │    │    AuditLog        │   │
│ tg_id  │ └───┬────┘   │    │────────────────────│   │
└───┬────┘     │        │    │ id            UUID │   │
    │          │        │    │ userId    FK → User │───┘
    │          │        │    │ action     VARCHAR │
    │          │        │    │ entity     VARCHAR │
    │          │        │    │ entityId      UUID │
    │          │        │    │ oldValue     JSONB │
    │          │        │    │ newValue     JSONB │
    │          │        │    │ ipAddress  VARCHAR │
    │          │        │    └────────────────────┘
    │          │        │
    │    ┌─────┴────────┴──────┐
    │    │                     │
    │    ▼                     ▼
    │  ┌───────────────┐  ┌──────────────────┐
    │  │  Appointment  │  │ BonusTransaction │
    │  │───────────────│  │──────────────────│
    │  │ id       UUID │  │ id          UUID │
    ├──│ staffId    FK │  │ clientId      FK │
    │  │ clientId   FK │  │ amount      FLOAT│
    │  │ serviceId  FK │  │ type         ENUM│
    │  │ startTime TIME│  │ reason    VARCHAR│
    │  │ endTime   TIME│  └──────────────────┘
    │  │ status   ENUM │
    │  │ notes    TEXT │
    │  └──────┬────────┘
    │         │
    │         │ 1:0..1
    │         ▼
    │  ┌───────────────┐
    │  │   Payment     │
    │  │───────────────│
    │  │ id       UUID │
    │  │ appointId  FK │
    │  │ amount   FLOAT│
    │  │ method    ENUM│
    │  │ status    ENUM│
    │  │ bonusUsed    │
    │  │ bonusEarned  │
    │  │ receiptNum   │
    │  └───────────────┘
    │
    │          ┌──────────────┐
    ├──────────│  MedRecord   │
    │          │──────────────│
    │          │ id      UUID │
    │          │ clientId  FK │───── Client
    │          │ staffId   FK │───── Staff
    │          │ diagnosis    │
    │          │ treatment    │
    │          │ teethMap JSON│
    │          └──────┬───────┘
    │                 │
    │                 │ 1:N
    │                 ▼
    │          ┌──────────────┐
    └──────────│  Document    │
               │──────────────│
               │ id      UUID │
               │ clientId  FK │───── Client
               │ staffId   FK │───── Staff
               │ medRecId  FK │───── MedRecord
               │ type     ENUM│
               │ origName     │
               │ storedName   │
               │ mimeType     │
               │ size     INT │
               │ checksum     │
               └──────────────┘


┌──────────────┐        ┌──────────────────┐
│   Service    │        │   OtpCode        │
│──────────────│        │──────────────────│
│ id      UUID │        │ id          UUID │
│ name  VARCHAR│        │ phone     VARCHAR│
│ price  FLOAT │        │ codeHash  VARCHAR│
│ duration INT │        │ expiresAt   TIME │
│ category     │        │ used        BOOL │
│ isActive BOOL│        │ attempts     INT │
│ sortOrder INT│        │ ipAddress VARCHAR│
└──────────────┘        └──────────────────┘
   │
   │ 1:N                ┌──────────────────┐
   └────── Appointment  │ ClinicSettings   │
                        │──────────────────│
                        │ id = "singleton" │
                        │ name             │
                        │ address          │
                        │ phone            │
                        │ bonusPercent     │
                        │ ownerTelegramId  │
                        └──────────────────┘
```

---

## Описание связей

### User ← → Staff (1:0..1)
- Один User может иметь один профиль Staff
- При удалении User каскадно удаляется Staff
- Связь через `Staff.userId` (UNIQUE FK)

### User ← → Client (1:0..1)
- Один User может иметь один профиль Client
- При удалении User каскадно удаляется Client
- Связь через `Client.userId` (UNIQUE FK)

### User → RefreshToken (1:N)
- Пользователь может иметь несколько refresh-токенов (разные устройства)
- При удалении User каскадно удаляются все токены
- Связь через `RefreshToken.userId` (FK)

### User → PushSubscription (1:N)
- Пользователь может подписаться на push с нескольких устройств
- При удалении User каскадно удаляются подписки
- Связь через `PushSubscription.userId` (FK)

### User → AuditLog (1:N)
- Каждая мутация записывает лог с userId
- Связь через `AuditLog.userId` (FK)
- Логи НЕ удаляются каскадно (аудит сохраняется)

### Client → Appointment (1:N)
- Клиент может иметь множество записей
- Связь через `Appointment.clientId` (FK)

### Staff → Appointment (1:N)
- Врач может иметь множество записей
- Связь через `Appointment.staffId` (FK)

### Service → Appointment (1:N)
- Услуга может быть в множестве записей
- Связь через `Appointment.serviceId` (FK)

### Appointment → Payment (1:0..1)
- Запись может иметь одну оплату (или не иметь)
- Связь через `Payment.appointmentId` (UNIQUE FK)

### Client → MedRecord (1:N)
- У пациента множество медицинских записей
- Связь через `MedRecord.clientId` (FK)

### Staff → MedRecord (1:N)
- Врач создаёт множество медицинских записей
- Связь через `MedRecord.staffId` (FK)

### MedRecord → Document (1:N)
- К мед. записи может быть прикреплено несколько документов
- Связь через `Document.medRecordId` (FK, nullable)

### Client → Document (1:N)
- Документы могут принадлежать пациенту напрямую
- Связь через `Document.clientId` (FK, nullable)

### Staff → Document (1:N)
- Документы загружаются сотрудником
- Связь через `Document.staffId` (FK, nullable)

### Client → BonusTransaction (1:N)
- У клиента множество бонусных операций
- Связь через `BonusTransaction.clientId` (FK)

---

## Кардинальность связей (сводка)

```
User     1 ─── 0..1  Staff
User     1 ─── 0..1  Client
User     1 ─── 0..*  RefreshToken
User     1 ─── 0..*  PushSubscription
User     1 ─── 0..*  AuditLog

Staff    1 ─── 0..*  Appointment
Staff    1 ─── 0..*  MedRecord
Staff    1 ─── 0..*  Document

Client   1 ─── 0..*  Appointment
Client   1 ─── 0..*  MedRecord
Client   1 ─── 0..*  Document
Client   1 ─── 0..*  BonusTransaction

Service  1 ─── 0..*  Appointment

Appointment 1 ─── 0..1 Payment

MedRecord   1 ─── 0..* Document
```

---

## Индексы

### Обоснование индексов

| Таблица | Индекс | Тип | Обоснование |
|---|---|---|---|
| User | phone | UNIQUE | Поиск при OTP-аутентификации |
| User | role | B-TREE | Фильтрация по ролям |
| Staff | isActive | B-TREE | Список активных врачей для записи |
| Client | userId | B-TREE | Быстрая связь User→Client |
| Appointment | clientId | B-TREE | Список записей пациента |
| Appointment | staffId | B-TREE | Расписание врача |
| Appointment | startTime | B-TREE | Поиск слотов, фильтр по дате |
| Appointment | status | B-TREE | Фильтрация по статусу |
| Service | category | B-TREE | Фильтр каталога по категории |
| Service | isActive | B-TREE | Только активные услуги |
| MedRecord | clientId | B-TREE | История лечения пациента |
| MedRecord | date | B-TREE | Сортировка по дате |
| Document | clientId | B-TREE | Документы пациента |
| Document | medRecordId | B-TREE | Документы к мед. записи |
| Payment | status | B-TREE | Отчёты по оплатам |
| Payment | createdAt | B-TREE | Финансовые отчёты за период |
| BonusTransaction | clientId | B-TREE | История бонусов клиента |
| OtpCode | phone | B-TREE | Поиск кода по телефону |
| OtpCode | expiresAt | B-TREE | Очистка истёкших кодов |
| RefreshToken | userId | B-TREE | Токены пользователя |
| RefreshToken | tokenHash | B-TREE | Поиск при refresh |
| AuditLog | userId | B-TREE | Логи по пользователю |
| AuditLog | entity | B-TREE | Логи по сущности |
| AuditLog | createdAt | B-TREE | Фильтр по дате |
| PushSubscription | userId | B-TREE | Подписки пользователя |

---

## Ограничения целостности

### Внешние ключи
- Все FK ссылаются на PK (UUID) целевой таблицы
- `ON DELETE CASCADE`: Staff, Client, RefreshToken, PushSubscription (привязаны к User)
- `ON DELETE RESTRICT` (по умолч.): Appointment, Payment, MedRecord, Document (нельзя удалить пока есть ссылки)

### Уникальные ограничения
- `User.phone` — один аккаунт на телефон
- `Staff.userId` — один Staff на User
- `Client.userId` — один Client на User
- `Payment.appointmentId` — одна оплата на запись
- `Payment.receiptNumber` — уникальный номер чека
- `PushSubscription.endpoint` — один endpoint на устройство

### Бизнес-правила (проверяемые в service-слое)
- Appointment: startTime < endTime
- Appointment: нет пересечений слотов для одного врача
- Payment.bonusUsed <= Client.bonusBalance
- OtpCode.attempts < 3
- Максимум 3 OtpCode за час для одного phone

---

## Прогноз объёма данных

| Таблица | 1 год | 3 года | Средний размер строки |
|---|---|---|---|
| User | 500 | 2 000 | 200 байт |
| Staff | 10 | 15 | 500 байт |
| Client | 500 | 2 000 | 300 байт |
| Appointment | 3 000 | 10 000 | 300 байт |
| Service | 20 | 30 | 200 байт |
| MedRecord | 2 000 | 8 000 | 500 байт |
| Document | 1 000 | 5 000 | 200 байт (метаданные) |
| Payment | 2 500 | 8 000 | 200 байт |
| BonusTransaction | 5 000 | 16 000 | 150 байт |
| OtpCode | 5 000 | 15 000 | 150 байт |
| RefreshToken | 2 000 | 5 000 | 300 байт |
| AuditLog | 15 000 | 50 000 | 500 байт |
| PushSubscription | 1 000 | 3 000 | 300 байт |
| ClinicSettings | 1 | 1 | 200 байт |

**Итого (без файлов):** ~10 МБ (1 год), ~40 МБ (3 года)
**Файлы (uploads):** ~5 ГБ (1 год), ~20 ГБ (3 года)
