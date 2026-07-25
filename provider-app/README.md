# Ahilney Provider App

React Native / Expo mobile app for Doctors and Rehabilitation Specialists.

## Setup

```bash
cd provider-app
npm install
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your machine's LAN IP or deployed URL
```

## Running

```bash
npx expo start          # Scan QR with Expo Go
npx expo start --android
npx expo start --ios    # macOS only
```

## Login credentials (seed data)

| Email | Password |
|-------|----------|
| amira.k@ahilney.com | password123 |
| karim.a@ahilney.com | password123 |
| hassan.s@ahilney.com | password123 |

## Screens

| Screen | Description |
|--------|-------------|
| Login | Email + password → JWT stored in SecureStore |
| Home | Stats row, pending requests (Accept/Reject), upcoming visits, Start Session |
| Clinical Room | Full-screen dark overlay with live timer, session notes textarea |
| Summary Form | Post-session: chief complaint, clinical findings, treatment plan, home exercise, follow-up |
| Schedule | Weekly shift editor — add/remove time slots per day, save to API |
| Patients | Patient list derived from appointment history, tap for session history detail |
| Wallet | Balance hero card, earnings breakdown (gross / 15% fee / net), payout history |
| Profile | Provider details, rating, document status badges, onboarding stepper, language toggle |

## Clinical Session Flow

1. Provider taps **Start Session** on a Confirmed visit card
2. API sets appointment → `In Progress`
3. **Clinical Room** opens: live timer starts, notes textarea available
4. Provider taps **End Session** → confirmation alert
5. **Summary Form** opens: fills chief complaint, clinical findings, treatment plan (required), plus optional fields
6. Submit → API sets appointment → `Session Summary Submitted`, creates summary record for admin audit
7. On admin approval → payout credited to provider wallet

## Architecture

```
provider-app/
├── app/                        # Expo Router file-based routes
│   ├── _layout.js              # Root: QueryClient + AuthProvider + I18nProvider + AuthGuard
│   ├── (auth)/
│   │   └── login.js            # Email/password login
│   └── (tabs)/
│       ├── _layout.js          # Bottom tabs + notification + pending badge
│       ├── index.js            # Home: stats, requests, visits, session room, summary form
│       ├── schedule.js         # Weekly shift editor
│       ├── patients.js         # Patient list + detail modal
│       ├── wallet.js           # Balance + earnings breakdown + payout history
│       └── profile.js          # Info, docs, onboarding stepper, language toggle
├── src/
│   ├── api/client.js           # Fetch wrapper + all provider API methods + SecureStore token
│   ├── context/AuthContext.js
│   ├── i18n/                   # en.js, ar.js, index.js
│   └── components/
│       └── StatusBadge.js
```
