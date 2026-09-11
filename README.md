# HomeTracker

HomeTracker is a self-hosted household management suite. Its flagship feature is AI-powered receipt parsing that turns real-world (Hungarian grocery) receipts into a structured ledger, then splits every line item between household members into penny-perfect debts.

## Features

### Implemented

- **AI receipt scanning** — upload a photo, get structured data back (store, total, payment method, line items):
  - Unit normalization (g/dkg/kg → kg; ml/cl/dl/L → L)
  - Multipack detection (e.g. `3x28g`)
  - Discount handling with post-discount pricing
- **Households** — multi-tenant containers with join codes, admin/member roles, promote/kick, soft deletes
- **Receipt splitting** — per-item ownership assignment using the Largest Remainder Method (exact to 2 decimals)
- **Debt engine** — per-receipt and household-level summaries, with a settlement workflow (`unsettled → pending → settled`)
- **Auth** — JWT + bcrypt, register/login
- **User profiles** — display name, avatar upload, Revolut/Discord links
- **i18n** — English and Hungarian, no hardcoded UI strings

### Roadmap

- Persistent upload storage (S3/Supabase/Cloudinary)
- Global error handling (translated JSON errors)
- Financial ledger — historical debt settlements (`transactions`)
- Optimistic UI updates for split toggling
- Home Assistant integration
- Chore tracking between household members

## Tech Stack

### Backend (`api/`)

- FastAPI + PostgreSQL (raw `psycopg2`, no ORM)
- JWT (`python-jose`) + `bcrypt` auth
- LiteLLM → Gemini vision for receipt parsing (Base64 image payloads)
- Soft deletes for financial and member data

### Frontend (`frontend/hometracker/`)

- React 19 + Vite + TypeScript (strict)
- Tailwind CSS 4
- TanStack Query for server state
- react-router 7, i18next, lucide-react

## Getting Started

### Prerequisites

- Python 3.14
- Node.js
- Docker (for PostgreSQL)

### Backend

1. Start PostgreSQL:

   ```bash
   cd api
   docker compose up -d
   ```

2. Create a virtualenv and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r api/requirements.txt
   ```

3. Configure environment — `cp api/.env.example api/.env`, then fill it in:

   | Variable | Purpose |
   |---|---|
   | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
   | `JWT_KEY` | Secret for signing JWT tokens |
   | `LLM_MODEL` | LiteLLM model id (a Gemini vision model) |
   | `GEMINI_API_KEY` | API key for the vision model |
   | `UPLOAD_DIR` | Directory for uploaded avatars |

4. Run the server (from `api/` — the app uses flat imports, so the working
   directory matters):

   ```bash
   uvicorn server:app --reload
   ```

### Frontend

```bash
cd frontend/hometracker
npm install
npm run dev
```

The dev server proxies `/api` and `/uploads` to `http://localhost:8000`, so the
frontend is same-origin in development too — no API URL to configure. To point
at a backend on another machine, set `VITE_API_ORIGIN` (see
`frontend/hometracker/.env.example`).

## Deployment (LAN, Docker)

The root `docker-compose.yml` runs the whole stack: Postgres, the API, and nginx
serving the built frontend. Only the frontend is published; the API and database
stay on the internal network.

1. Create the deployment config:

   ```bash
   cp .env.example .env
   # edit .env: DB_PASSWORD, JWT_KEY, GEMINI_API_KEY, WEB_PORT
   ```

2. Build and start:

   ```bash
   docker compose up -d --build
   ```

3. Initialize the schema (first run only):

   ```bash
   docker compose exec api python init_db.py
   ```

The UI is then at `http://<server-lan-ip>:<WEB_PORT>`.

### How the pieces connect

- **web** (nginx) serves the React bundle and reverse-proxies `/api` and
  `/uploads` to the `api` service. The frontend calls those relative paths, so
  nothing about host, port, or scheme is baked into the bundle — it works behind
  any address, with or without TLS.
- **api** (uvicorn) reaches `db` over the compose network. Its database host and
  upload directory are supplied by `docker-compose.yml`, not `api/.env`.
- **db** stores its data in the named volume `pgdata`; uploaded avatars persist
  in `./api/uploads` on the host.

### Schema changes

`schema.sql` is the source of truth and the stored data is disposable, so the
workflow is rebuild-from-scratch rather than incremental migrations:

```bash
docker compose exec api python init_db.py --reset
```

### Dependency locking

`api/requirements.txt` is a generated lock, not hand-edited. `api/requirements.in`
holds the direct dependencies; regenerate the lock with:

```bash
uv pip compile api/requirements.in --python-version 3.14 -o api/requirements.txt
```

Do not generate it with `pip freeze` from a shared virtualenv — that captures
unrelated packages and can include local builds that are not installable.

## Releasing

```bash
git tag -a v1.0.0 -m "HomeTracker 1.0.0"
git push origin main
git push origin v1.0.0
gh release create v1.0.0 --title "HomeTracker 1.0.0" --notes-file CHANGELOG.md
```

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Identity, profile metadata, Revolut/Discord links |
| `households` | Multi-tenant containers with join codes |
| `household_members` | Join table, roles (admin/member), soft delete |
| `stores` | Catalog of unique store names |
| `items` | Product catalog (receipt name vs clean name) |
| `receipts` | Master record (payee, total, payment method, household) |
| `receipt_items` | Receipt ↔ item with `quantity` and `price_paid` |
| `item_owners` | Splitting map — `amount` (`numeric(12,2)`), `settled` status |
