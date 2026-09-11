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

3. Configure environment in `api/.env`:

   | Variable | Purpose |
   |---|---|
   | `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL credentials |
   | `JWT_KEY` | Secret for signing JWT tokens |
   | `LLM_MODEL` | LiteLLM model id (a Gemini vision model) |
   | `GEMINI_API_KEY` | API key for the vision model |
   | `UPLOAD_DIR` | Directory for uploaded avatars |

4. Run the server (from `api/`):

   ```bash
   uvicorn server:app --reload
   ```

### Frontend

```bash
cd frontend/hometracker
npm install
npm run dev
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
