# MiniLedger API

Base URL: `http://localhost:4000`

Health: `GET /health` → `{ status: 'ok' }`

## Auth

### POST /api/auth/request-otp
```json
{
  "phone": "+919876543210"
}
```
Response:
```json
{
  "message": "OTP sent to +919876543210 (check server log)",
  "devOtp": "483921"
}
```
- Logs OTP to server console: `========== MOCK OTP ==========`
- Rate limit: 20 / 15min
- Validation: phone `^\+?\d{10,15}$`

### POST /api/auth/verify-otp
```json
{
  "phone": "+919876543210",
  "otp": "483921"
}
```
Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbG...",
  "user": { "id": 1, "phone": "+919876543210" }
}
```
- TTL 5 min, max 5 attempts, consumed on success.

Use `Authorization: Bearer <token>` for all loan routes.

## Loans

### POST /api/loans
```json
{
  "friendName": "Rohan Sharma",
  "amount": 1500,
  "dueDate": "2026-12-31",
  "receiptUrl": "https://example.com/receipt.jpg" // optional
}
```

### GET /api/loans
Returns array:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "friend_name": "Rohan Sharma",
    "amount": "1500.00",
    "due_date": "2026-12-31T00:00:00.000Z",
    "is_repaid": false,
    "isOverdue": true,
    "receipt_url": null,
    "created_at": "2026-02-..."
  }
]
```

### GET /api/loans/summary
```json
{
  "totalLent": 4000,
  "totalRepaid": 1500,
  "outstanding": 2500,
  "overdueAmount": 1500,
  "overdueCount": 1,
  "activeCount": 2,
  "totalCount": 3
}
```

### PATCH /api/loans/:id/repay
Marks repaid, sets `repaid_at = NOW()`.

### POST /api/loans/:id/receipt
Multipart form: `receipt` field → image/*, max 5MB.
Returns:
```json
{
  "message": "Receipt uploaded",
  "receiptUrl": "/uploads/1720000000-abc123.jpg",
  "loan": { "...updated loan..." }
}
```
Served at `GET /uploads/<file>`.

### Errors
All errors:
```json
{ "error": "message", "details": { } }
```
Auth missing → `401`, validation → `400`, not found → `404`.
