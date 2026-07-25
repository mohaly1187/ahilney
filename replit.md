# Ahilney Prototype

A static frontend prototype for **Ahilney** — a home physical therapy and telehealth consulting platform based in Egypt.

## Stack

- Pure HTML / CSS / JavaScript (no build step)
- State managed entirely via `localStorage` and `sessionStorage`
- No backend, no external services, no secrets required

## Running

The app is served by Python's built-in HTTP server from the `ahilney/` directory on port 5000.

```
python3 -m http.server 5000 --directory ahilney
```

The **"Start application"** workflow handles this automatically.

## Access

- **URL**: open the preview pane
- **Password**: `ahilney`

## Portals

| Portal | File | Who it's for |
|---|---|---|
| Gateway | `ahilney/index.html` | Entry point / login |
| Admin | `ahilney/admin.html` | Operations & oversight |
| Provider | `ahilney/provider.html` | Doctors & rehab specialists |
| Patient | `ahilney/patient.html` | Patients booking sessions |

Shared state and mock data live in `ahilney/app.js`.

## User preferences

_None recorded yet._
