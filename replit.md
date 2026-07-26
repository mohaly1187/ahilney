# Ahilney

Home healthcare and physical therapy platform for Egypt — connects patients with doctors (online consultations) and Rehabilitation Specialists (home visits).

## Project Structure

This is a monorepo with four apps and a shared API:

| Directory | What it is | Port |
|-----------|-----------|------|
| `api/` | Node.js + Express REST API | 3000 |
| `admin-app/` | React + Vite admin dashboard | 5173 |
| `patient-app/` | Expo (React Native) patient app — web mode | 8080 |
| `provider-app/` | Expo (React Native) provider app — web mode | 8099 |
| `ahilney-prototype/` | Static HTML/CSS prototype (legacy reference) | 5000 |

## Running the Project

All five services start automatically via Replit workflows. Use the port switcher in the preview pane to view each one:

- **Port 5000** — Static prototype (default preview)
- **Port 5173** — Admin dashboard
- **Port 8080** — Patient mobile app (web)
- **Port 8099** — Provider mobile app (web)

## Dev Credentials

### Admin Dashboard (port 5173)
- `ops@ahilney.com` / `password123`

### Provider App (port 8099)
- `amira.k@ahilney.com` / `password123`
- `karim.a@ahilney.com` / `password123`

### Patient App (port 8080)
- Uses OTP login — phone number `+20 100 000 0001` in development (SMS logged to console)

## Database

Uses Replit's built-in PostgreSQL. Schema is set up via:
```
cd api && node migrate.js
```
Seed data via:
```
cd api && node seed.js
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Auto-provided by Replit |
| `JWT_SECRET` | Token signing (set in Replit env) |
| `NODE_ENV` | `development` (set in Replit env) |
| `EXPO_PUBLIC_API_URL` | API base URL for Expo apps (empty = relative, proxied) |

## API

- Health check: `GET /health`
- Route list: `GET /api/v1`
- Auth: OTP for patients, email/password for providers and admins

## Tech Stack

- **API**: Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt
- **Admin**: Vite, React 19, Tailwind CSS 4, TanStack Query
- **Mobile**: Expo SDK 57, React Native 0.86, Expo Router, TanStack Query

## Notes

- The Expo apps run in **web mode** in Replit (not native). The `src/api/client.js` in both uses `localStorage` on web and `expo-secure-store` on native for token storage.
- SMS in development logs OTP codes to the API console instead of sending real SMS.
- `scripts/xdg-open` is a no-op shim that prevents Expo from crashing when trying to open a browser in the headless Replit container.
