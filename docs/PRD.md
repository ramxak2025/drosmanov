# Product Requirements Document — Dr. Osmanov

## 1. Problem Statement

Dental clinics lack an integrated mobile-first tool that serves patients,
doctors, and owners in one app. Current solutions are desktop-heavy, expensive,
or not adapted for the Russian market. Small and mid-size dental practices need
an affordable, self-hosted system that handles scheduling, patient records,
payments, and analytics — all accessible from a smartphone.

## 2. Goals

- **Patients** can book appointments and access their records from a phone
- **Staff** manage their schedule and patient cards without paper
- **Owner** has real-time analytics and full control over the clinic
- **System** is installable as a PWA on iOS and Android with offline capabilities
- **Deployment** runs on a single VDS with Docker Compose — no cloud dependencies

## 3. Non-Goals (v1)

- Inventory / supplies management
- Online payment processing (cash/card in-clinic only)
- Multi-branch support
- Insurance integration
- Multi-language support (Russian only in v1)
- Video consultations / telemedicine
- Integration with external EHR systems

## 4. User Personas

### CLIENT — Пациент

| Attribute | Detail |
|---|---|
| Profile | Age 25-65, smartphone user, wants convenience |
| Goals | Book appointments quickly, view treatment history, get reminders |
| Pain points | Calling to book, forgetting appointments, no access to X-rays |
| Key flows | Sign up via OTP → Browse services → Pick doctor → Pick slot → Confirm |
| Devices | iPhone (Safari), Android (Chrome), mobile-first |

- Books appointments via phone in under 2 minutes
- Views treatment history, X-rays, and documents
- Receives SMS + push reminders before appointments
- Accumulates and spends bonus points
- Can cancel appointments (24h+ before start time)

### STAFF — Сотрудник (врач или администратор)

| Attribute | Detail |
|---|---|
| Profile | Doctor or admin, uses app throughout the day |
| Goals | Manage schedule, fill patient cards, process payments |
| Pain points | Paper records, manual scheduling conflicts, no digital tooth map |
| Key flows | View today's schedule → Open patient card → Fill record → Process payment |
| Devices | Primarily mobile, occasionally tablet/desktop |

- Manages daily schedule with status transitions
- Fills patient medical records with tooth map (FDI notation)
- Uploads X-rays and documents (camera capture on mobile)
- Processes payments with bonus point calculation
- Receives Telegram alerts for new bookings and cancellations

### OWNER — Владелец

| Attribute | Detail |
|---|---|
| Profile | Clinic owner, needs oversight and financial control |
| Goals | Monitor performance, manage staff, view financials |
| Pain points | No real-time visibility, manual reporting, staff management |
| Key flows | View dashboard → Check revenue → Manage staff → Export reports |
| Devices | Mobile + desktop |

- Monitors clinic performance via KPI dashboard
- Manages staff profiles, schedules, and salaries
- Views financial reports with revenue charts
- Receives daily summary via Telegram
- Manages service catalog and pricing
- Exports financial data to CSV
- Full access to all system data and audit logs

## 5. Feature Map

### Authentication
- Phone-based OTP authentication (SMS via SMS.ru)
- 4-digit code, 10-minute expiry, rate-limited
- RS256 JWT with 15-minute access tokens
- Refresh token rotation (30-day expiry, httpOnly cookie)
- Role-based redirects after login (CLIENT/STAFF/OWNER)

### Client Features
| Feature | Screen | Priority |
|---|---|---|
| Appointment booking | /client/booking | P0 |
| Visit history | /client/visits | P0 |
| Document viewer | /client/documents | P1 |
| Profile & bonus balance | /client/profile | P1 |
| Home / quick actions | /client/home | P0 |

### Staff Features
| Feature | Screen | Priority |
|---|---|---|
| Daily schedule | /staff/schedule | P0 |
| Patient search & card | /staff/patients/[id] | P0 |
| Payment processing | /staff/cash | P0 |
| Document upload | /staff/patients/[id] | P1 |
| Tooth map editor | /staff/patients/[id] | P1 |

### Owner Features
| Feature | Screen | Priority |
|---|---|---|
| KPI Dashboard | /owner/dashboard | P0 |
| Staff management | /owner/staff | P0 |
| Service catalog | /owner/services | P0 |
| Financial reports | /owner/finance | P1 |
| Clinic settings | /owner/settings | P1 |

### Notifications
| Channel | Use Case |
|---|---|
| SMS (SMS.ru) | OTP codes, appointment reminders |
| Web Push (VAPID) | Appointment reminders, status updates |
| Telegram Bot | Staff alerts (new booking/cancellation), owner daily report |
| Socket.io | Real-time schedule updates in-app |

## 6. Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Appointment booking time | < 2 minutes | Client-side timing from service selection to confirmation |
| Data integrity | Zero data loss | ACID transactions, daily DB backups verified |
| OTP delivery | < 10 seconds | SMS.ru delivery reports |
| Page load (4G) | < 2 seconds | Lighthouse performance score |
| PWA score | >= 90 | Lighthouse PWA audit |
| Uptime | 99.5% | Health endpoint monitoring |
| Offline availability | Schedule viewable offline | Service worker cache verification |

## 7. Constraints

- Russian language only (v1) — all UI text in Russian (ru-RU)
- Works offline: schedule view and basic navigation cached via service worker
- Must install as PWA on iOS Safari and Android Chrome
- Complies with Russian personal data law (152-ФЗ)
- Single VDS deployment on Beget hosting
- No external cloud services except SMS.ru and Telegram Bot API
- Budget-conscious: no paid SaaS dependencies

## 8. Release Plan

### v1.0 — MVP
- All P0 features across all roles
- OTP authentication
- Core booking flow
- Schedule management
- Payment processing
- Basic dashboard
- PWA installation
- SMS + Push notifications

### v1.1 — Enhancements
- P1 features (documents, profiles, finance export)
- Telegram bot integration
- Tooth map editor
- Advanced analytics

### Future (v2+)
- Multi-branch support
- Inventory management
- Online payments
- Insurance integration
- Multi-language
