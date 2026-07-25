# Ahilney Prototype

A static frontend prototype for **Ahilney** — a home physical therapy and telehealth consulting platform based in Egypt.

## Stack

- Pure HTML / CSS / JavaScript (no build step)
- State managed entirely via `localStorage` and `sessionStorage`
- No backend, no external services, no secrets required

## Running

The app is served by Python's built-in HTTP server from the `ahilney-prototype/` directory on port 5000.

```
python3 -m http.server 5000 --directory ahilney-prototype
```

The **"Start application"** workflow handles this automatically.

## Access

- **URL**: open the preview pane
- **Gateway password**: `ahilney`

## Portals

| Portal | File | Who it's for | Design |
|---|---|---|---|
| Gateway | `ahilney-prototype/index.html` | Entry point / login | Dark landing page |
| **Patient App** | `ahilney-prototype/patient.html` | Patients booking homecare sessions | ✅ Mobile-first redesign |
| Provider App | `ahilney-prototype/provider.html` | Doctors & rehab specialists | In progress (Task #5) |
| Admin Dashboard | `ahilney-prototype/admin.html` | Operations & oversight | In progress (Task #6) |
| Center Admin | `ahilney-prototype/center_admin.html` | Rehab center management | Out of scope |

Shared state and mock data live in `ahilney-prototype/app.js`.

## Patient App – Key flows (Task #4 complete)

- **OTP login**: switch patients via the simulator dropdown → any 4-digit code logs in
- **Home tab**: wallet balance card, service tiles, recent activity, promo banners
- **Book tab**: district filter → filtered RS provider cards → profile sheet → 4-step booking modal (prescription · date/slot · package · payment)
- **Appointments tab**: filterable list with status badges; Rate & Review for finished sessions; Book Again for rejected ones
- **Wallet tab**: balance, top-up (mock), transaction history, pending cash visits
- **Profile tab**: patient info, medical history, prescription, treatment plans

## User preferences

_None recorded yet._
