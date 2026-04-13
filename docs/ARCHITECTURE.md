# System Architecture — Dr. Osmanov

## 1. High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                    VDS (Beget)                       │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐     │
│  │  Nginx   │    │  Next.js │    │  NestJS   │     │
│  │ :80/:443 │───▶│  :3000   │    │  :3001    │     │
│  │ SSL/TLS  │    │  PWA     │───▶│  REST API │     │
│  │ Rate Lim │    │  SSR     │    │  WebSocket│     │
│  └──────────┘    └──────────┘    └─────┬─────┘     │
│                                        │           │
│                                  ┌─────▼─────┐     │
│                                  │PostgreSQL │     │
│                                  │  :5432    │     │
│                                  └───────────┘     │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  /var/uploads — static files (nginx-blocked) │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

External Services:
  SMS.ru API ──────────── OTP codes + appointment reminders
  Telegram Bot API ─────── Staff/owner alerts + daily reports
  Web Push (VAPID) ──────── Browser push notifications
```

## 2. Technology Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Frontend | Next.js (App Router) | 14.x | SSR, SEO, PWA support, file-based routing |
| Styling | TailwindCSS + CSS Variables | 3.x | Utility-first, design tokens, mobile-first |
| Animations | Framer Motion | 10.x | Spring physics, page transitions, gesture support |
| Server State | TanStack Query | v5 | Caching, optimistic UI, background refetch |
| Charts | Recharts | 2.x | Composable, lightweight, SVG-based |
| Backend | NestJS | 10.x | Modular architecture, decorators, DI, TypeScript-native |
| ORM | Prisma | 5.x | Type-safe queries, auto migrations, schema-first |
| Database | PostgreSQL | 16.x | ACID, JSON support, full-text search, battle-tested |
| Auth | JWT (RS256) + OTP | - | Asymmetric keys, short-lived tokens, phone-based |
| Realtime | Socket.io | 4.x | Bidirectional events, auto-reconnect, room support |
| File Processing | Multer + Sharp | - | Memory-based upload, WebP conversion, EXIF stripping |
| SMS | SMS.ru API | - | Russian market leader, delivery reports |
| Push | Web Push API (VAPID) | - | Standard PWA push, no vendor lock-in |
| Telegram | node-telegram-bot-api | - | Staff/owner alerting, daily reports |
| Monorepo | Turborepo | 1.x | Shared packages, parallel builds, caching |
| Containers | Docker Compose | v2 | Reproducible deployment, service orchestration |
| Reverse Proxy | Nginx | 1.25 | SSL termination, rate limiting, static files |

## 3. Monorepo Structure

```
dr-osmanov/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── test/
│   │   └── Dockerfile
│   └── web/                    # Next.js frontend
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── public/
│       └── Dockerfile
├── packages/
│   └── shared/                 # Shared types, utils, constants
│       └── src/
│           ├── types/
│           ├── utils/
│           └── constants/
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── app.conf
├── docs/
├── docker-compose.yml
├── turbo.json
├── package.json
└── .env.example
```

## 4. Request Flow

### Standard API Request
```
1. Client (Browser/PWA)
   → HTTPS request
2. Nginx (:443)
   → SSL termination
   → Rate limiting check
   → Route: /api/* → proxy to NestJS
   → Route: /* → proxy to Next.js
3. NestJS (:3001)
   → Global ValidationPipe (whitelist DTO)
   → JwtAuthGuard (verify RS256 token)
   → RolesGuard (check @Roles decorator)
   → Controller → Service → Prisma
4. Prisma
   → Parameterized query → PostgreSQL
5. Response
   → TransformInterceptor wraps in { data, meta }
   → AuditInterceptor logs mutations
   → Back through Nginx → Client
```

### WebSocket Connection
```
1. Client establishes Socket.io connection
2. Nginx upgrades to WebSocket (/socket.io/)
3. NestJS Socket.io Gateway
   → JWT verification on connection
   → Join room based on role/userId
4. Server pushes events:
   → appointment:created
   → appointment:statusChanged
   → schedule:updated
```

## 5. Authentication Flow

### OTP Send
```
POST /api/auth/send-otp { phone: "+79001234567" }
  → Nginx rate limit (3 req/min for OTP endpoint)
  → NestJS Throttler (additional rate limit)
  → Validate phone format (Russian +7XXXXXXXXXX)
  → Check: max 3 OTPs per phone per hour
  → Generate 4-digit code
  → Store bcrypt hash in OtpCode table (NEVER plaintext)
  → Send SMS via SMS.ru
  → Response: { success: true }
```

### OTP Verify
```
POST /api/auth/verify-otp { phone: "+79001234567", code: "1234" }
  → Find latest unused, non-expired OTP for phone
  → Check: max 3 verify attempts per code
  → Increment attempts BEFORE comparing (timing attack prevention)
  → bcrypt.compare(code, codeHash)
  → If valid: mark OTP as used
  → Find or create User (default role: CLIENT)
  → Issue RS256 access token (15min TTL, contains { sub, role, jti })
  → Issue refresh token (random 64 bytes, stored as bcrypt hash, 30-day TTL)
  → Set refresh token as httpOnly, Secure, SameSite=Strict cookie
  → Response: { accessToken, user: { id, name, role } }
```

### Token Refresh
```
POST /api/auth/refresh
  → Read refresh token from httpOnly cookie
  → Find matching token hash in DB
  → Check: not revoked, not expired
  → Revoke old refresh token
  → Issue new access + refresh token pair (rotation)
  → Response: { accessToken }
```

### Logout
```
POST /api/auth/logout
  → Read refresh token from cookie
  → Delete from DB
  → Clear cookie
  → Response: { success: true }
```

## 6. Data Flow — Appointment Booking

```
Client App                          API Server                    Database
    │                                   │                            │
    ├── GET /services ─────────────────▶│── Query services ─────────▶│
    │◀── List of active services ──────│◀── Service[] ──────────────│
    │                                   │                            │
    ├── GET /staff?serviceId=X ────────▶│── Query staff for service ▶│
    │◀── Available doctors ────────────│◀── Staff[] ────────────────│
    │                                   │                            │
    ├── GET /appointments/slots ───────▶│── Get staff schedule ─────▶│
    │   ?staffId=Y&date=2024-03-15     │── Get existing appointments▶│
    │                                   │── Calculate free slots     │
    │◀── Available time slots ─────────│◀── Slot[] ────────────────│
    │                                   │                            │
    ├── POST /appointments ────────────▶│── Validate slot available ▶│
    │   { staffId, serviceId,          │── BEGIN TRANSACTION        │
    │     startTime, endTime }         │── Create appointment ─────▶│
    │                                   │── COMMIT                   │
    │                                   │── Notify staff (Socket.io) │
    │                                   │── Notify staff (Telegram)  │
    │                                   │── Queue SMS reminder       │
    │◀── Appointment created ──────────│◀── Appointment ───────────│
```

## 7. Security Layers

```
Layer 1: Network (Nginx)
  ├── SSL/TLS termination (Let's Encrypt)
  ├── Rate limiting (per-IP zones: OTP=3/min, API=60/min)
  ├── Hidden server tokens
  ├── HSTS header (max-age=31536000)
  └── /uploads/ directory blocked (deny all)

Layer 2: Application (NestJS)
  ├── Helmet (security headers)
  ├── CORS whitelist (frontend URL only)
  ├── NestJS Throttler (backup rate limiting)
  ├── Global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
  └── class-validator DTOs on every endpoint

Layer 3: Authentication
  ├── RS256 JWT (asymmetric — private key signs, public key verifies)
  ├── 15-minute access token TTL
  ├── Refresh token rotation with bcrypt hash storage
  ├── httpOnly, Secure, SameSite=Strict cookies
  └── OTP: bcrypt-hashed, rate-limited, single-use

Layer 4: Authorization
  ├── @Roles() decorator on every endpoint
  ├── RolesGuard checks JWT role claim
  ├── Ownership verification in service layer (IDOR prevention)
  └── CLIENT: own data only | STAFF: own patients | OWNER: all

Layer 5: Data
  ├── Prisma parameterized queries (no raw SQL)
  ├── UUID primary keys (non-sequential)
  ├── PII masking in logs (phone: +7***1234)
  └── Audit log on every write operation

Layer 6: Files
  ├── MIME type + magic byte validation
  ├── UUID filenames (no user input in paths)
  ├── Sharp processing (EXIF strip, resize, WebP)
  ├── Authenticated download endpoint (no public URLs)
  └── Path traversal prevention (resolve + startsWith check)
```

## 8. Caching Strategy

| Data | Strategy | TTL | Invalidation |
|---|---|---|---|
| Service catalog | TanStack Query staleTime | 10 min | On mutation |
| Staff list | TanStack Query staleTime | 5 min | On mutation |
| Available slots | No cache (real-time) | 0 | Always fresh |
| Dashboard KPIs | TanStack Query staleTime | 5 min | Manual refresh |
| Static assets | Service Worker cache-first | Until SW update | New deployment |
| HTML pages | Network-first with fallback | - | Always fresh |

## 9. Error Handling Strategy

### API Error Response Format
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Описание ошибки на русском",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "path": "/api/appointments"
}
```

### HTTP Status Codes Used
| Code | Meaning | Example |
|---|---|---|
| 200 | Success | GET request fulfilled |
| 201 | Created | Appointment created |
| 400 | Bad Request | Invalid DTO / validation failure |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | IDOR / wrong role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Time slot already booked |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected server error |

## 10. Deployment Architecture

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   DNS (Beget)  │
              │ yourdomain.ru  │
              └───────┬────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │     VDS (Ubuntu 22.04) │
         │     Docker Compose     │
         │                        │
         │  ┌─────────────────┐   │
         │  │  nginx:1.25     │   │ ← external network
         │  │  :80 → :443     │   │
         │  └────────┬────────┘   │
         │           │            │
         │  ─────────┼──────────  │ ← internal network
         │           │            │
         │  ┌────────┴────────┐   │
         │  │    /api/* →     │   │
         │  │  NestJS :3001   │   │
         │  │    /* →         │   │
         │  │  Next.js :3000  │   │
         │  └────────┬────────┘   │
         │           │            │
         │  ┌────────┴────────┐   │
         │  │  PostgreSQL     │   │
         │  │  :5432          │   │
         │  └─────────────────┘   │
         │                        │
         │  Volume: pgdata        │
         │  Volume: uploads       │
         └────────────────────────┘
```

### Network Isolation
- **external network**: Only Nginx is exposed to the internet (ports 80, 443)
- **internal network**: API, Web, and PostgreSQL communicate only internally
- PostgreSQL is NOT accessible from outside the Docker network
- UFW firewall: allow 22 (SSH), 80, 443 only
