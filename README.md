# MiniLedger — Track money lent to friends

> A minimal, interview-ready full-stack app: **Node.js + TypeScript + PostgreSQL** backend with mock OTP login, and **React Native (Expo)** app with overdue highlighting, receipt upload, validation & tests.

![Expo](https://img.shields.io/badge/RN-Expo-000020?style=flat&logo=expo)
![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20TS-3178C6)
![DB](https://img.shields.io/badge/DB-PostgreSQL-336791?logo=postgresql)
![Tests](https://img.shields.io/badge/tests-jest%20%2B%20supertest-green)

<p align="center">
  <img src="./docs/mockup.png" width="320" alt="MiniLedger app mockup" />
  <br/>
  <em>MiniLedger — Summary + Overdue highlighting + Receipts</em>
</p>

---

## 🎥 Screen recording (2–3 min walkthrough)

**Loom / Drive link:** `https://www.loom.com/share/MiniLedger-demo-placeholder`  
> **Replace this with your actual Loom after you finish testing.**  
> Script to record (kept to ~2:30):
> 1. `0:00` Show `docker-compose up` + server log with OTP
> 2. `0:30` Login screen → enter phone → Send OTP → read OTP from log/dev hint → Verify
> 3. `1:00` Home: summary card (Total Lent / Repaid / Overdue / Outstanding), empty state
> 4. `1:20` Add loan: show validation (empty name, negative amount, bad date) → create 2 loans (one past due, one future)
> 5. `1:50` Show overdue highlighted in red, attach receipt photo, mark one as Repaid → summary updates, filter
> 6. `2:20` Show tests passing + closing

---

## ✨ Features

**Backend**

- **Phone + Mock OTP** – `POST /api/auth/request-otp` prints 6-digit OTP to server log (TTL 5 min, rate-limited). `POST /api/auth/verify-otp` returns JWT (30d). New users auto-created.
- **Loans** – `POST /api/loans` add entry (`friendName, amount, dueDate, receiptUrl?`), `GET /api/loans` list with `isOverdue` computed, `PATCH /api/loans/:id/repay`.
- **Summary** – `GET /api/loans/summary` → `totalLent, totalRepaid, outstanding, overdueAmount, overdueCount, activeCount, totalCount`.
- **Receipt upload** – `POST /api/loans/:id/receipt` (multipart `receipt`, 5 MB, image-only) served statically at `/uploads/<file>`.
- **Validation** – `zod` on all inputs, rate-limit on OTP, JWT auth middleware, global error handler.
- **PostgreSQL with memory fallback** – If `DATABASE_URL` missing/unreachable, app runs in-memory (perfect for review without Docker/DB). Tests always use memory.
- **Tests** – `jest + supertest + ts-jest` covering auth, validation, overdue logic, summary, double-repay guard, auth guard.

**App (React Native + Expo)**

- **Login** – phone → OTP flow, shows dev OTP hint, stores JWT in AsyncStorage.
- **Home** – summary card at top, list of loans with overdue ones highlighted in red (`#fff1f2` + red border), pull-to-refresh, Mark Repaid with confirmation.
- **Add Entry** – form with full validation, amount coercion, dueDate `YYYY-MM-DD` helper, receipt picker via `expo-image-picker`, error messages inline.
- **Bonus** – receipt upload integrated (pick from gallery → upload after creation).

---

## 🏗️ Architecture

```
MiniLedger/
├─ backend/                  # Express + TS + pg
│  ├─ src/
│  │  ├─ index.ts            # app bootstrap, static uploads, error handler
│  │  ├─ db.ts               # pg Pool + in-memory fallback, schema init
│  │  ├─ routes/auth.ts      # request-otp / verify-otp (+ rate limit)
│  │  ├─ routes/loans.ts     # CRUD + summary + receipt upload
│  │  ├─ middleware/auth.ts  # JWT verifier
│  │  └─ utils/otp.ts        # OTP store (TTL, attempts, log)
│  └─ __tests__/api.test.ts
├─ mobile/                    # Expo (React Native)
│  ├─ App.tsx                 # Navigation + AuthProvider routing
│  ├─ src/screens/*           # Login, Home, AddLoan
│  ├─ src/components/*        # SummaryCard, LoanCard
│  ├─ src/api/client.ts       # BASE_URL + JWT helpers
│  └─ src/context/AuthContext # AsyncStorage token persistence
├─ docker-compose.yml         # postgres + backend
└─ README.md
```

**Auth**: OTP 6-digit, logged, TTL 5 min, max 5 attempts, rate limit 20/15 min. JWT `id+phone` signed with `JWT_SECRET`.

**DB Schema**:

```sql
users(id, phone UNIQUE, created_at)
loans(id, user_id FK, friend_name, amount, due_date, is_repaid, repaid_at, receipt_url, created_at)
```

**Overdue logic**: `!is_repaid && due_date < today (00:00)` → `isOverdue=true`, counted in summary.

---

## 🚀 Quick start (3 commands)

### Option A — No Docker (fastest for review)

Requires Node 18+.

```bash
# 1. Backend (in-memory mode, no Postgres needed)
cd backend
cp .env.example .env   # optional; if DATABASE_URL unset → memory mode
npm install
npm run dev            # -> http://localhost:4000  (OTP in console)

# In another terminal, run tests
npm test               # 14 tests, all passing

# 2. Mobile
cd ../mobile
npm install
# set API URL if needed (LAN IP for physical device)
# echo "EXPO_PUBLIC_API_URL=http://192.168.1.5:4000" > .env  # or localhost for simulator/web
npx expo start          # scan QR with Expo Go, or press w for web
```

### Option B — With PostgreSQL (Docker)

```bash
docker compose up --build   # starts postgres:5432 + backend:4000
# backend auto-creates tables on boot

# mobile same as above, but BASE_URL=http://localhost:4000 (or LAN IP)
cd mobile && npx expo start
```

### Env

`backend/.env`:

```
PORT=4000
DATABASE_URL=postgres://miniledger:miniledger@localhost:5432/miniledger
JWT_SECRET=super-secret-jwt-key-change-in-prod
NODE_ENV=development
```

> `DATABASE_URL` absent → in-memory mode (no DB setup). `NODE_ENV=production` hides `devOtp` in response.

---

## 📱 Using the app

1. Open Expo Go, scan QR.
2. **Login**: enter any phone e.g. `+919876543210` → **Send OTP** → check terminal where backend runs for `========== MOCK OTP ==========` → enter it (or use dev hint shown). For quick test the login screen also shows the dev OTP.
3. **Home**: see summary. Pull to refresh. Overdue loans appear with red background.
4. **Add**: tap `+ Add` → fill friend, amount, due date (`YYYY-MM-DD`). Tip: use past date like `2020-01-01` to demo overdue. Optionally pick a receipt photo.
5. **Repay**: tap `Mark Repaid` on a card → confirm → card turns green, summary updates.

**API quick test with curl**:

```bash
# Request OTP
curl -X POST http://localhost:4000/api/auth/request-otp -H "Content-Type: application/json" -d '{"phone":"+919876543210"}'
# Check server log for OTP, e.g. 483921
curl -X POST http://localhost:4000/api/auth/verify-otp -H "Content-Type: application/json" -d '{"phone":"+919876543210","otp":"483921"}'
# Copy token
TOKEN=eyJhbG...
curl http://localhost:4000/api/loans/summary -H "Authorization: Bearer $TOKEN"
```

---

## 🔌 API Reference

| Method | Route | Auth | Body / Notes |
|--------|-------|------|--------------|
| POST | `/api/auth/request-otp` | no | `{ phone }` |
| POST | `/api/auth/verify-otp` | no | `{ phone, otp }` → `{ token, user }` |
| POST | `/api/loans` | JWT | `{ friendName, amount, dueDate, receiptUrl? }` |
| GET | `/api/loans` | JWT | list with `isOverdue` |
| GET | `/api/loans/summary` | JWT | summary object |
| PATCH | `/api/loans/:id/repay` | JWT | marks repaid |
| POST | `/api/loans/:id/receipt` | JWT | `multipart: receipt=image` |
| GET | `/uploads/:file` | no | static receipt |
| GET | `/health` | no | health check |

**Error shape**: `{ error: string, details?: ... }`. JWT missing → `401`.

---

## ✅ Validation & Tests

- **Phone**: `^\+?\d{10,15}$`
- **OTP**: 6 digits, expiry 5 min, max 5 attempts.
- **Loan**: `friendName 2–100 chars`, `amount >0 ≤1e6`, `dueDate parseable date`.
- **Upload**: image only, 5 MB max.
- Run `npm test` for 14 cases: auth happy/expired/invalid/rate, loan create/validation/list/overdue/repay/summary/auth-guard. All use memory mode, no DB.

---

## 📸 Screenshots

| App Mockup | Live Demo |
|------------|------------|
| ![mockup](./docs/mockup.png) | Use `npx expo start` → Scan QR |

> Bonus: Add your real device screenshots to `./docs/` (`login.png`, `home.png` etc.) before submission.

---

## 🗣️ Interview cheat-sheet (how to explain every part)

- **Why Express + TS + pg?** Simple, type-safe, pg for assignment, but fallback to memory so reviewer doesn’t need DB.
- **OTP flow**: In-memory map per phone, TTL + attempt counter, log to stdout, rate-limited. Could swap to Twilio/AWS SNS later – interface stays same.
- **Auth**: After OTP verify, upsert user, sign JWT. Middleware reads `Authorization: Bearer <token>`. Mobile persists to AsyncStorage.
- **Overdue**: computed on read (`due_date < today 00:00 && !is_repaid`) – no cron needed, consistent.
- **Summary**: aggregate in TS after `listLoans` (could be SQL `SUM(CASE...)` in prod). Returns lent/repaid/outstanding/overdue.
- **Receipt**: Multer disk storage, static serve, image MIME guard, size limit. Client uses FormData.
- **Trade-offs**: In-memory fallback great for demo but not persistent; Postgres path is production-ready (Pool, indexes). Could add Prisma/Drizzle for migrations.
- **What’s next**: pagination, search, edit/delete loan, push notifications for due reminders, unit for frontend, CI.

---

## 📦 Submission checklist

- [x] GitHub repo with README (this file)
- [x] Backend runnable with `npm run dev` + tests with `npm test`
- [x] App runnable with `npx expo start`
- [x] Bonus: receipt upload + validation + tests
- [ ] **TODO:** record Loom (2–3 min) and replace link at top

---

## 📄 License

MIT – for assignment purposes.

---

**Built by Aryan — Full Stack Intern assignment for Harsh (Due 24 Oct 2026). Replace Loom link before submitting.**
