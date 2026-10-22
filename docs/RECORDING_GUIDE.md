# Screen Recording Guide — MiniLedger (2-3 min)

This guide ensures your Loom video covers all assignment requirements.

## Setup before recording
1. `docker compose up` or `npm run dev` in backend — keep terminal visible to show OTP log.
2. Have Expo start ready: `cd mobile && npx expo start` — show QR + web preview (`w`).
3. Prepare test data:
   - Friend A: Rohan, 1500, due 2020-01-01 (will be overdue)
   - Friend B: Amit, 2500, due 2026-12-31 (active)
4. Clear any existing data (restart backend in memory mode or truncate tables).

## Recording Script (2:30)

**0:00-0:30 Backend**
- Show VS Code, project structure, `docker-compose.yml`, `README.md`
- Show `npm test` passing (12 tests)
- Show server log: `MiniLedger backend running on http://0.0.0.0:4000`

**0:30-1:00 Login**
- Open Expo Go / web simulator
- Enter phone `+919876543210` → Send OTP
- Flip to server terminal → show `========== MOCK OTP ==========` → copy OTP
- Back to app → Verify & Login

**1:00-1:40 Home + Summary**
- Show empty state → summary card (0 lent, 0 repaid)
- Explain cards: Total Lent, Repaid, Outstanding, Overdue

**1:40-2:10 Add + Overdue**
- Tap + Add → demo validation: leave name empty → show error, negative amount → error, bad date → error
- Fill valid: Rohan, 1500, 2020-01-01 → Save → card appears RED (overdue)
- Add second: Amit, 2500, 2026-12-31 → card appears blue (active)
- Show receipt upload: pick image → upload → receipt attached badge

**2:10-2:30 Repay + Summary update**
- Tap Mark Repaid on overdue card → confirm → card turns green → summary updates (Total Repaid increases, Overdue decreases)
- Pull to refresh

## Closing line (say this)
> "MiniLedger uses mock OTP logged to console, JWT auth, Postgres with in-memory fallback, overdue computed on read, and receipt upload via Multer. I can explain every line — thanks for reviewing!"

## After recording
- Upload to Loom, set to "Anyone with link can view"
- Replace placeholder in README: `https://www.loom.com/share/MiniLedger-demo-placeholder`
- Add link to submission email.

## Tips
- Use desktop audio, 1080p, no background music.
- Keep terminal font large (18pt).
- If OTP not visible, use dev hint shown on app after Send OTP.
