---
name: Backend API decisions
description: Key architectural decisions for the Ahilney Node.js/Express API that downstream work must stay consistent with
---

# Backend API Decisions

## Stack
Node.js + Express (plain JS, no TypeScript), Replit built-in PostgreSQL (`pg` pool), JWT auth, `bcryptjs`. Source in `api/`, entry point `api/src/index.js`, port 3000.

**Why:** Owner wants Hetzner-portability — only `DATABASE_URL` and `JWT_SECRET` need changing to deploy elsewhere. No Replit-specific code in business logic.

## Auth model
- Patients: phone OTP (generated, logged to console in dev; pluggable via `api/src/sms.js` — set `SMS_PROVIDER=twilio` + credentials to switch)
- Providers + Admins: email + password (bcrypt)
- JWT subject (`sub`) is `users.id`; role-specific ID (`patientId`, `providerId`, `adminId`) also embedded in payload

## Commission & payout
- Platform takes 15%; provider receives 85% of appointment price
- Payout only triggers when admin approves a session summary (`POST /admin/summaries/:id/approve`)
- `total_charged` column on appointments stores exact amount collected at booking (package-aware + promo-discounted) — use this for refunds, not `price`

## Appointment state machine
`Pending RS Acceptance` → `Confirmed` → `Need Summary` (after `/start`) → `Finished` (after summary submitted + admin approves) | `Rejected`
- Summary endpoint enforces state gate: only `['Need Summary', 'Confirmed']` allowed
- Summary is idempotent: duplicate submission returns 409

## Schema evolution pattern
`api/migrate.js` has two sections:
1. `SQL` const — `CREATE TABLE IF NOT EXISTS` for all tables
2. `ALTERATIONS` const — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for columns added after initial schema

**Why:** Running migrate on an existing DB only applies the ALTERATIONS block; no need for a full migration framework.

## Notification security
`/notifications/:id/read` endpoints scope the UPDATE by `user_id` (patient via `patients.user_id` join; provider via JWT `sub`) to prevent IDOR cross-user modification.

## Seed data
`api/seed.js` uses `ON CONFLICT (id) DO NOTHING` — re-running the seed is safe but won't reset modified rows. If appointment `scheduled_date` is NULL after a re-seed (because rows existed before the column was added), run: `UPDATE appointments SET scheduled_date = CURRENT_DATE WHERE scheduled_date IS NULL`.
