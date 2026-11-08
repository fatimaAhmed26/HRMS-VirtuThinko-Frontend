# VirtuThinko HR Portal: Frontend

React + TypeScript + Vite frontend for the VirtuThinko HRMS. The API is in
[HRMS-VirtuThinko-Backend-](https://github.com/fatimaAhmed26/HRMS-VirtuThinko-Backend-).

## Stack

| Purpose | Library |
|---|---|
| UI | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 (brand red `#C00020` in `src/index.css`) |
| Routing | React Router 7 |
| Server data | TanStack Query (React Query) + axios |
| Forms | React Hook Form + Zod |
| Icons, dates | lucide-react, dayjs |

## Run it

The backend must be running first (`npm run dev` in the backend folder, port 5000).

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards every `/api/...` call to `http://127.0.0.1:5000`
(see `vite.config.ts`), so the refresh-token cookie works and no CORS setup is needed.

| Command | What it does |
|---|---|
| `npm run dev` | start the dev server |
| `npm run build` | type-check and build to `dist/` |
| `npm run lint` | check the code with oxlint |
| `npm run preview` | serve the built `dist/` folder |

## How sign-in works

1. `POST /api/auth/login` returns an **access token** (15 min) and sets an httpOnly **refresh cookie** (7 days).
2. The access token is kept **in memory only** (`src/lib/api.ts`), never in localStorage.
3. When a request gets 401, the app calls `POST /api/auth/refresh` once and repeats the request.
4. After a page reload, `AuthProvider` uses the refresh cookie to restore the session.

## Two views

- **HR view** for users with HR permissions (`HR_PERMISSIONS` in `src/lib/permissions.ts`).
- **Employee view** for everyone, including managers. HR users switch with "Employee view" in the top bar.
- Employees never see payroll (no payslips, no salary). The backend enforces this too.
- HR users scoped to BH or SA only receive their entity's data from the API.

## Folders

```
src/
  api/          one file per backend module (employees.ts, leave.ts, payroll.ts ...)
  auth/         AuthProvider, useAuth hook, route guards
  components/
    layout/     AppLayout, Sidebar, Topbar, nav.ts (menu for both views)
    ui/         Button, Card, PageHeader, StatusBadge, Spinner, Feedback, PlaceholderPage
  lib/          api client (token refresh), formatters, permission names
  pages/        hr/, employees/, leave/, payroll/, settings/, self/ (employee view)
  types/        TypeScript shapes of the API data
```
