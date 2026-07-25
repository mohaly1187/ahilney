# Ahilney Patient App

React Native / Expo mobile app for patients.

## Setup

```bash
cd patient-app
npm install
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your backend URL.

```bash
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your machine's LAN IP or deployed URL
```

## Running

```bash
# Start Expo dev server (scan QR with Expo Go)
npx expo start

# Android emulator
npx expo start --android

# iOS simulator (macOS only)
npx expo start --ios
```

## Screens

| Screen | Description |
|--------|-------------|
| Phone | Enter phone number to receive OTP |
| OTP | Verify 6-digit code, stores JWT in SecureStore |
| Home | Greeting, wallet balance strip, upcoming appointment, quick actions, notification bell |
| Book | District filter → provider list → provider profile sheet → 4-step booking modal |
| Appointments | Filterable list with Rate & Review sheet for completed sessions |
| Wallet | Balance hero card, transaction history, mock top-up sheet |
| Profile | Patient details, medical history, prescription, treatment plans, language toggle |

## API

The app connects to the Ahilney backend at `EXPO_PUBLIC_API_URL`. All authenticated routes use a Bearer JWT stored in `expo-secure-store`.

## i18n

English and Arabic string files live in `src/i18n/`. Toggle language from the Profile tab. UI layout stays LTR; RTL support can be added when required.

## Architecture

```
patient-app/
├── app/                  # Expo Router file-based routes
│   ├── _layout.js        # Root: QueryClient + AuthProvider + I18nProvider + AuthGuard
│   ├── (auth)/           # Unauthenticated stack
│   │   ├── phone.js      # Phone number entry
│   │   └── otp.js        # OTP verification
│   └── (tabs)/           # Authenticated bottom tabs
│       ├── index.js      # Home
│       ├── book.js       # Book (district → provider → booking modal)
│       ├── appointments.js
│       ├── wallet.js
│       └── profile.js
├── src/
│   ├── api/client.js     # Fetch wrapper + all API methods + SecureStore token
│   ├── context/AuthContext.js
│   ├── i18n/             # en.js, ar.js, index.js
│   └── components/
│       ├── StatusBadge.js
│       ├── AppointmentCard.js
│       └── ProviderCard.js
```
