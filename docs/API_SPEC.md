# API Specification — Dr. Osmanov

## Базовая информация

- **Base URL:** `https://yourdomain.ru/api`
- **Формат:** JSON
- **Аутентификация:** Bearer JWT (RS256)
- **Версия:** 1.0.0

---

## Аутентификация

### POST /auth/send-otp
Отправка OTP-кода на телефон.

**Доступ:** публичный

**Запрос:**
```json
{
  "phone": "+79001234567"
}
```

**Ответ 200:**
```json
{
  "data": { "success": true },
  "meta": { "timestamp": "2024-03-15T10:00:00.000Z" }
}
```

**Ошибки:**
- `400` — неверный формат телефона
- `429` — превышен лимит (3 OTP/час на номер)

---

### POST /auth/verify-otp
Проверка OTP и выдача токенов.

**Доступ:** публичный

**Запрос:**
```json
{
  "phone": "+79001234567",
  "code": "1234",
  "name": "Иван Иванов"
}
```
`name` — опционально, используется при первой регистрации.

**Ответ 200:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "id": "uuid",
      "phone": "+79001234567",
      "name": "Иван Иванов",
      "role": "CLIENT"
    }
  }
}
```
Также устанавливает `refreshToken` в httpOnly cookie.

**Ошибки:**
- `401` — неверный или истёкший код
- `401` — превышено количество попыток (3 на код)

---

### POST /auth/refresh
Обновление access token через refresh token из cookie.

**Доступ:** cookie с refreshToken

**Ответ 200:**
```json
{
  "data": { "accessToken": "eyJhbGciOiJSUzI1NiIs..." }
}
```

**Ошибки:**
- `401` — refresh token отсутствует, отозван или истёк

---

### POST /auth/logout
Выход из системы — удаление refresh token.

**Доступ:** авторизованный пользователь

**Ответ 200:**
```json
{
  "data": { "success": true }
}
```

---

## Записи на приём

### GET /appointments
Список записей (фильтруется по роли).

**Доступ:** CLIENT, STAFF, OWNER

**Query параметры:**
| Параметр | Тип | Описание |
|---|---|---|
| status | string | Фильтр по статусу |
| startDate | ISO 8601 | Начало периода |
| endDate | ISO 8601 | Конец периода |
| staffId | uuid | Фильтр по врачу (OWNER) |
| page | number | Страница (по умолч. 1) |
| limit | number | Кол-во (по умолч. 20, макс. 100) |

**Ответ 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "startTime": "2024-03-15T10:00:00.000Z",
      "endTime": "2024-03-15T11:00:00.000Z",
      "status": "CONFIRMED",
      "notes": null,
      "client": { "id": "uuid", "user": { "name": "Иван" } },
      "staff": { "id": "uuid", "user": { "name": "Иванова А.С." }, "specialty": "Терапевт" },
      "service": { "id": "uuid", "name": "Лечение кариеса", "price": 3000, "duration": 60 }
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 20 }
}
```

---

### GET /appointments/slots
Доступные слоты для записи.

**Доступ:** CLIENT, STAFF, OWNER

**Query параметры:**
| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| staffId | uuid | да | ID врача |
| date | YYYY-MM-DD | да | Дата |
| serviceId | uuid | да | ID услуги (для длительности) |

**Ответ 200:**
```json
{
  "data": [
    { "start": "09:00", "end": "10:00" },
    { "start": "10:00", "end": "11:00" },
    { "start": "14:00", "end": "15:00" }
  ]
}
```

---

### POST /appointments
Создание записи.

**Доступ:** CLIENT, STAFF, OWNER

**Запрос:**
```json
{
  "staffId": "uuid",
  "serviceId": "uuid",
  "startTime": "2024-03-15T10:00:00.000Z",
  "endTime": "2024-03-15T11:00:00.000Z",
  "notes": "Болит верхний левый зуб"
}
```
Для CLIENT `clientId` берётся из JWT автоматически.

**Ответ 201:** объект Appointment

**Ошибки:**
- `400` — невалидные данные
- `409` — слот уже занят

---

### GET /appointments/:id
Получение записи по ID.

**Доступ:** CLIENT (свои), STAFF (свои), OWNER (все)

**Ответ 200:** объект Appointment с вложенными client, staff, service, payment

**Ошибки:**
- `403` — нет доступа (IDOR)
- `404` — не найдено

---

### PATCH /appointments/:id/status
Изменение статуса записи.

**Доступ:** STAFF, OWNER

**Запрос:**
```json
{
  "status": "CONFIRMED",
  "cancelReason": "Пациент попросил перенести"
}
```
`cancelReason` обязателен при статусе CANCELLED.

**Допустимые переходы:**
- PENDING → CONFIRMED, CANCELLED
- CONFIRMED → IN_PROGRESS, CANCELLED
- IN_PROGRESS → COMPLETED
- Обратные переходы запрещены

**Ответ 200:** обновлённый объект Appointment

---

### DELETE /appointments/:id
Отмена записи клиентом (только если > 24ч до начала).

**Доступ:** CLIENT (свои)

**Ответ 200:**
```json
{
  "data": { "success": true }
}
```

**Ошибки:**
- `400` — до приёма менее 24 часов
- `403` — чужая запись

---

## Услуги

### GET /services
Список услуг (прайс-лист).

**Доступ:** публичный (для формы записи)

**Query параметры:**
| Параметр | Тип | Описание |
|---|---|---|
| category | string | Фильтр по категории |
| isActive | boolean | Только активные (по умолч. true) |

**Ответ 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Лечение кариеса",
      "description": "Лечение кариеса любой сложности",
      "price": 3000,
      "duration": 60,
      "category": "Терапия",
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

---

### POST /services
Создание услуги.

**Доступ:** OWNER

**Запрос:**
```json
{
  "name": "Лечение кариеса",
  "description": "Лечение кариеса любой сложности",
  "price": 3000,
  "duration": 60,
  "category": "Терапия",
  "sortOrder": 1
}
```

---

### PATCH /services/:id
Обновление услуги.

**Доступ:** OWNER

---

### DELETE /services/:id
Деактивация услуги (soft delete — isActive = false).

**Доступ:** OWNER

---

## Пациенты

### GET /patients
Список пациентов.

**Доступ:** STAFF, OWNER

**Query параметры:**
| Параметр | Тип | Описание |
|---|---|---|
| search | string | Поиск по имени или телефону |
| page | number | Страница |
| limit | number | Кол-во |

---

### GET /patients/:id
Карточка пациента.

**Доступ:** CLIENT (свой), STAFF, OWNER

**Ответ 200:**
```json
{
  "data": {
    "id": "uuid",
    "user": { "name": "Иван Иванов", "phone": "+79001234567" },
    "birthDate": "1990-05-15",
    "address": "г. Москва",
    "bonusBalance": 1500,
    "allergyNotes": "Аллергия на лидокаин",
    "notes": "VIP клиент",
    "appointments": [],
    "medHistory": [],
    "documents": []
  }
}
```

---

### PATCH /patients/:id
Обновление данных пациента.

**Доступ:** CLIENT (свои), STAFF, OWNER

---

## Медицинские записи

### GET /med-records?clientId=uuid
Список мед. записей пациента.

**Доступ:** CLIENT (свои), STAFF, OWNER

---

### POST /med-records
Создание мед. записи.

**Доступ:** STAFF, OWNER

**Запрос:**
```json
{
  "clientId": "uuid",
  "diagnosis": "Кариес 36 зуба",
  "treatment": "Пломбирование композитом",
  "teethMap": { "36": "filled" },
  "notes": "Рекомендована чистка через 3 месяца"
}
```

---

### PATCH /med-records/:id
Обновление мед. записи.

**Доступ:** STAFF (автор), OWNER

---

## Документы

### POST /documents/upload
Загрузка файла.

**Доступ:** STAFF, OWNER

**Content-Type:** multipart/form-data

**Поля формы:**
| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| file | File | да | Файл (jpeg, png, webp, pdf, макс. 20МБ) |
| clientId | uuid | нет | ID пациента |
| medRecordId | uuid | нет | ID мед. записи |
| type | string | да | XRAY, PHOTO, CONTRACT, OTHER |

**Ответ 201:**
```json
{
  "data": {
    "id": "uuid",
    "originalName": "снимок.jpg",
    "storedName": "a1b2c3d4.webp",
    "mimeType": "image/webp",
    "size": 245000,
    "type": "XRAY",
    "uploadedAt": "2024-03-15T10:00:00.000Z"
  }
}
```

**Ошибки:**
- `400` — недопустимый тип или размер файла

---

### GET /documents/:id/download
Скачивание файла (аутентифицированный доступ).

**Доступ:** CLIENT (свои), STAFF, OWNER

**Ответ:** файл с заголовками Content-Disposition и Content-Type

---

## Оплата

### POST /payments
Создание оплаты для записи.

**Доступ:** STAFF, OWNER

**Запрос:**
```json
{
  "appointmentId": "uuid",
  "amount": 3000,
  "method": "CARD",
  "bonusUsed": 0
}
```

**Логика бонусов:**
- При оплате начисляется `bonusPercent`% от суммы (из ClinicSettings)
- `bonusUsed` не может превышать `bonusBalance` клиента
- При method=BONUS вся сумма списывается с бонусов
- При method=MIXED — `bonusUsed` + остаток наличными/картой

---

### GET /payments/receipt/:id
Получение чека.

**Доступ:** STAFF, OWNER

**Ответ 200:**
```json
{
  "data": {
    "receiptNumber": "clx1abc2d3",
    "date": "2024-03-15T10:00:00.000Z",
    "patient": "Иван Иванов",
    "service": "Лечение кариеса",
    "doctor": "Иванова А.С.",
    "amount": 3000,
    "method": "CARD",
    "bonusUsed": 0,
    "bonusEarned": 150
  }
}
```

---

## Сотрудники

### GET /staff
Список сотрудников.

**Доступ:** CLIENT (активные, для записи), STAFF, OWNER

---

### GET /staff/:id
Профиль сотрудника.

**Доступ:** STAFF (свой), OWNER

---

### POST /staff
Создание сотрудника (создаёт User + Staff).

**Доступ:** OWNER

**Запрос:**
```json
{
  "phone": "+79007654321",
  "name": "Иванова Анна Сергеевна",
  "specialty": "Терапевт",
  "bio": "Стаж 10 лет",
  "salary": 80000,
  "workSchedule": {
    "mon": { "start": "09:00", "end": "18:00" },
    "tue": { "start": "09:00", "end": "18:00" },
    "wed": null,
    "thu": { "start": "09:00", "end": "18:00" },
    "fri": { "start": "09:00", "end": "16:00" },
    "sat": null,
    "sun": null
  }
}
```

---

### PATCH /staff/:id
Обновление сотрудника.

**Доступ:** OWNER

---

## Аналитика

### GET /analytics/overview
KPI-показатели.

**Доступ:** OWNER

**Query:** `period=today|week|month|year`

**Ответ 200:**
```json
{
  "data": {
    "revenue": 450000,
    "appointmentsTotal": 120,
    "appointmentsCompleted": 95,
    "appointmentsCancelled": 8,
    "newClients": 15,
    "averageCheck": 4736
  }
}
```

---

### GET /analytics/revenue-chart
Данные для графика выручки.

**Доступ:** OWNER

**Query:** `period=week|month|year`, `groupBy=day|week|month`

**Ответ 200:**
```json
{
  "data": [
    { "date": "2024-03-01", "revenue": 45000 },
    { "date": "2024-03-02", "revenue": 32000 }
  ]
}
```

---

### GET /analytics/top-services
Топ услуг по выручке.

**Доступ:** OWNER

**Query:** `period=month|year`, `limit=10`

**Ответ 200:**
```json
{
  "data": [
    { "service": "Установка импланта", "count": 5, "revenue": 300000 },
    { "service": "Профессиональная чистка", "count": 30, "revenue": 150000 }
  ]
}
```

---

### GET /analytics/export
Экспорт финансовых данных в CSV.

**Доступ:** OWNER

**Query:** `startDate`, `endDate`

**Ответ:** CSV файл с заголовками:
`Дата, Пациент, Врач, Услуга, Сумма, Метод оплаты, Бонусы использовано, Бонусы начислено`

---

## Push-уведомления

### POST /push/subscribe
Подписка на push-уведомления.

**Доступ:** авторизованный пользователь

**Запрос:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

---

## Настройки клиники

### GET /settings
Получение настроек.

**Доступ:** OWNER

---

### PATCH /settings
Обновление настроек.

**Доступ:** OWNER

**Запрос:**
```json
{
  "name": "Dr. Osmanov",
  "address": "г. Махачкала, ул. Примерная, 1",
  "phone": "+78001234567",
  "email": "info@drosmanov.ru",
  "bonusPercent": 5,
  "ownerTelegramId": "123456789"
}
```

---

## Аудит-лог

### GET /audit-logs
Просмотр логов действий.

**Доступ:** OWNER

**Query параметры:**
| Параметр | Тип | Описание |
|---|---|---|
| userId | uuid | Фильтр по пользователю |
| entity | string | Фильтр по сущности |
| startDate | ISO 8601 | Начало периода |
| endDate | ISO 8601 | Конец периода |
| page | number | Страница |
| limit | number | Кол-во |

---

## Здоровье

### GET /health
Проверка работоспособности.

**Доступ:** публичный

**Ответ 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Общий формат ответов

### Успешный ответ
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-03-15T10:00:00.000Z",
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Ошибка
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Описание ошибки на русском",
  "timestamp": "2024-03-15T10:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Используемые HTTP-коды
| Код | Значение |
|---|---|
| 200 | Успех |
| 201 | Создано |
| 400 | Невалидные данные |
| 401 | Не авторизован |
| 403 | Нет доступа |
| 404 | Не найдено |
| 409 | Конфликт (слот занят) |
| 429 | Слишком много запросов |
| 500 | Внутренняя ошибка |
