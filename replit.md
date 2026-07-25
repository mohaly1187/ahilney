# Ahilney Platform

A home physical therapy and telehealth consulting platform for Egypt — three apps sharing a real PostgreSQL backend.

## Architecture

| Layer | Stack | Port |
|---|---|---|
| **Backend API** | Node.js + Express + PostgreSQL | 3000 |
| **Prototype / Admin (HTML)** | Static HTML/JS served by Python | 5000 |

## Running

Both workflows start automatically:
- **"Start application"** — serves the prototype HTML files on port 5000
- **"Ahilney API"** — runs the real Express API on port 3000

## API

Base URL: `http://localhost:3000/api/v1`

Route manifest: `GET /api/v1`  
Health check: `GET /health`

### Auth endpoints
| Method | Path | Who |
|---|---|---|
| POST | `/auth/send-otp` | Patient — phone OTP (console-logged in dev) |
| POST | `/auth/verify-otp` | Patient — returns JWT |
| POST | `/auth/provider/login` | Provider — email + password |
| POST | `/auth/admin/login` | Admin — email + password |

### Seed credentials (dev)
| Role | Email | Password |
|---|---|---|
| Admin | `sherif@ahilney.com` | `admin123` |
| Doctor | `sarah.j@ahilney.com` | `password` |
| Doctor | `marcus.v@ahilney.com` | `password` |
| RS | `amira.k@ahilney.com` | `password` |
| RS | `karim.a@ahilney.com` | `password` |
| RS | `hassan.s@ahilney.com` | `password` |
| Patient (OTP) | phone: `+201211098465` | any 6-digit code logged to console |

## Database

Replit built-in PostgreSQL. Tables: `users`, `patients`, `patient_prescriptions`, `patient_treatment_plans`, `providers`, `provider_documents`, `provider_regions`, `shifts`, `admins`, `appointments`, `summaries`, `transactions`, `notifications`, `otp_requests`, `promo_codes`, `regions`, `subregions`.

Re-run migrations (safe — uses IF NOT EXISTS):
```
node api/migrate.js
```

Re-seed dev data:
```
node api/seed.js
```

## Business Logic

- **Commission**: 15% platform / 85% provider
- **Payout trigger**: admin approves session summary → payout transaction written + provider wallet credited
- **Appointment state machine**: `Pending RS Acceptance` → `Confirmed` → `Finished` (provider submits summary) → admin audits
- **OTP**: SMS adapter in `api/src/sms.js` — console-logs in dev, swap to Twilio/Unifonic by setting `SMS_PROVIDER=twilio` and adding credentials (owner must approve before wiring)
- **Hetzner-portable**: only `DATABASE_URL` and `JWT_SECRET` env vars need changing to deploy elsewhere

## API source layout

```
api/
├── migrate.js          # Schema migrations (run once)
├── seed.js             # Dev seed data
└── src/
    ├── index.js        # Express entry point
    ├── db.js           # pg Pool
    ├── sms.js          # SMS adapter (pluggable)
    ├── middleware/
    │   └── auth.js     # JWT verify + requireRole helpers
    └── routes/
        ├── auth.js     # OTP + login endpoints
        ├── patients.js # Patient endpoints
        ├── providers.js# Provider endpoints
        ├── admin.js    # Admin endpoints
        └── shared.js   # Public: providers list, regions, services, promos
```

## Prototype (legacy reference)

The original localStorage prototype lives in `ahilney-prototype/`. It is kept as a design reference for the three real apps being built (Tasks #11, #12, #13).

## User preferences

_None recorded yet._
