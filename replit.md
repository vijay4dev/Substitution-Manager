# Substitution Manager

A daily school administration tool for the principal of Kawar International School, Pali — to assign and print teacher substitutions each morning.

## Run & Operate

- `pnpm --filter @workspace/substitution-manager run dev` — run the frontend app
- `pnpm run typecheck` — full typecheck across all packages
- Required secrets: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (shadcn/ui)
- Backend: Firebase (Firestore + Firebase Auth) — no separate server
- Excel parsing: SheetJS (`xlsx`)
- Routing: wouter

## Where things live

- `artifacts/substitution-manager/src/` — main app
- `artifacts/substitution-manager/src/lib/firebase.ts` — Firebase init
- `artifacts/substitution-manager/src/lib/auth.tsx` — AuthContext + ProtectedRoute
- `artifacts/substitution-manager/src/pages/` — Login, Import, Assignments, Print, Reports

## Architecture decisions

- Firebase is the sole backend — no Express API server used by the frontend
- Timetable import is client-side: SheetJS parses the Excel file in the browser, then writes to Firestore in batched writes (≤500 per batch)
- Free period rule: a slot is free ONLY if the cell is truly empty/whitespace — any text (including "REM", "HALF DAY", etc.) means the teacher is occupied
- No signup UI — principal account created directly in Firebase console
- Print view uses CSS `@media print` to hide navigation/buttons and render a clean A4 table

## Product

- **Login** — single principal account via Firebase email/password auth
- **Import** — one-time upload of master timetable Excel (.xlsx); parses and writes to Firestore; re-upload replaces all data
- **Daily Assignments** — pick a date, see free teachers per period, assign substitutions with conflict prevention, delete rows to free teachers back up
- **Print View** — clean printable table (Pr. / Class / Substitution / Sign.) for the selected date, matching the school's physical format
- **Weekly Reports** — view substitution counts per teacher for a selected week, sorted by count descending

## Gotchas

- Firestore compound queries on `timetable` (day + period + isFree) and `substitutions` (date) may require index creation — Firebase console will provide a one-click link on first query
- The principal must be created in the Firebase console (Authentication → Users → Add user); there is no signup UI in the app

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
