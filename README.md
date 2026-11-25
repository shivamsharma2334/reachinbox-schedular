# ReachInbox Email Scheduler

A full-stack starter implementation for a durable email scheduling dashboard. It uses React + Vite + TypeScript, Express + TypeScript, PostgreSQL/Prisma, Redis + BullMQ, Nodemailer SMTP, Google OAuth, Slack notifications, and optional Elasticsearch indexing/search.

> **Important delivery guarantee:** SMTP does not provide a universal exactly-once delivery primitive. If an SMTP server accepts a message and the worker crashes before persisting the success result, a retry can send a duplicate. This project persists jobs, attempts, and idempotency keys and avoids duplicate API scheduling, but it cannot mathematically guarantee exactly-once SMTP delivery. For strict provider-side idempotency, use an email API that supports idempotency keys.

## Requirements
- Node.js 20+
- Aiven PostgreSQL database
- Layerbase Redis endpoint (TLS)
- Google OAuth credentials (optional until sign-in)
- SMTP account (Ethereal is suitable for development)
- Elasticsearch endpoint (optional; search route returns no indexed results if not configured)

No Docker is required.

## 1. Configure backend
```bash
cd backend
npm install
cp .env.example .env
```
Fill in `DATABASE_URL`, `SHADOW_DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `ENCRYPTION_KEY`. Do not commit `.env`.

For Aiven, use the connection URI with `?sslmode=require`. Create a separate shadow database named `reachinbox_shadow` in Aiven (or choose another name and update the URL). Prisma `migrate dev` uses the shadow database. If your Aiven plan/permissions do not allow creating another database, use an appropriate migration workflow rather than pointing the shadow URL at your production database.

For Layerbase, use the TLS `rediss://` URL. The Redis helper sets TLS SNI to the endpoint hostname, which Layerbase requires. Keep the hostname exactly as provided by Layerbase.

Generate a 32-byte encryption key as 64 hexadecimal characters:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Use the output as `ENCRYPTION_KEY`. Generate a JWT secret similarly:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 2. Initialize PostgreSQL and verify services
```bash
npx prisma validate
npx prisma generate
npm run test:connections
npx prisma migrate dev --name init
```
Open the database browser with `npm run db:studio`.

## 3. Configure OAuth
Create a Google OAuth web client. Add this authorized redirect URI:
`http://localhost:5000/api/auth/google/callback`
Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in backend `.env`.

Slack OAuth is scaffolded in the API. Create a Slack app with `chat:write` bot scope and callback URL `http://localhost:5000/api/slack/callback`. The connect route signs a short-lived state token bound to the authenticated user and validates it on callback. For production, also add OAuth integration tests and consider storing one-time state nonces to prevent replay.

## 4. Start backend
```bash
npm run dev
```
Health check: `http://localhost:5000/api/health`.

## 5. Start frontend
In a second terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173`.

## 6. Create an Ethereal SMTP account
Create a test inbox at https://ethereal.email/ and copy its SMTP host, port, username, and password into the dashboard's **Add sender** form. Ethereal captures test messages; it does not deliver them to real recipients. For actual sending, configure an SMTP provider you are authorized to use.

## API
All endpoints are relative to `http://localhost:5000/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/auth/google` | Begin Google sign-in |
| GET | `/auth/google/callback` | OAuth callback |
| GET | `/auth/me` | Current user (Bearer token) |
| GET/POST | `/emails/senders` | List/create SMTP senders |
| GET/POST | `/emails` | List/schedule emails |
| DELETE | `/emails/:id` | Cancel a pending email |
| GET | `/search?q=...` | Search Elasticsearch index |
| GET | `/slack/connect` | Begin Slack connect flow |

`POST /emails` accepts `{senderId, recipient, subject, body, scheduledAt?, idempotencyKey?}`. Use a stable `idempotencyKey` for retries of the same client request.

## Notes and production hardening
- Redis/BullMQ is the scheduling mechanism; there is no cron dependency.
- PostgreSQL is the source of truth; BullMQ is the execution queue.
- The worker records each delivery attempt and retries transient failures with exponential backoff.
- The per-sender hourly cap is checked against successful sends in the previous hour. For multiple worker processes, implement an atomic Redis limiter or a transaction/lock to prevent simultaneous jobs from exceeding the cap.
- The current minimum delay is enforced per job, not as a globally serialized sender-wide delay across multiple workers. For strict per-sender spacing, serialize jobs by sender or use a distributed sender lock.
- On process restart, run a reconciliation task to re-enqueue due `SCHEDULED`/`QUEUED` rows not present in BullMQ. A production deployment should also include graceful worker shutdown and queue/database health monitoring.
- Add CSRF/state validation for OAuth, refresh-token handling, secure cookies or hardened token storage, SMTP credential rotation, request validation/error middleware, and integration tests before production.
- Elasticsearch indexing helper is provided; wire it into the successful-send transaction/event path and add index lifecycle/retention policies for production.
- Never expose SMTP credentials, encryption keys, OAuth secrets, or database/Redis URLs to the frontend or commit them to source control.

## Project layout
```
backend/   Express API, Prisma schema, BullMQ worker, OAuth and SMTP services
frontend/  React dashboard
```
