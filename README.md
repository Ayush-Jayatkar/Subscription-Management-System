# Brightloop – Subscription Management System

A shared starter repository for the Brightloop Software problem statement. It contains the common application foundation only; business modules are intentionally left as placeholders so the team can implement and integrate them in separate branches.

## Stack

- Frontend: React 19, Vite, React Router, Axios, Lucide
- Backend: Python 3.11+, FastAPI, Pydantic Settings, SQLAlchemy 2
- Database: PostgreSQL 17 (Docker Compose)
- API docs: FastAPI Swagger UI at `/docs`

## Project structure

```text
brightloop-subscription-system/
├── backend/
│   └── app/modules/
│       ├── identity_catalog/          # Person 1
│       ├── subscriptions_invoicing/   # Person 2
│       └── finance/                  # Person 3
├── frontend/
│   └── src/features/
│       ├── identity-catalog/          # Person 1
│       ├── subscriptions-invoicing/   # Person 2
│       └── finance/                  # Person 3
├── database/                          # Shared database notes/scripts
├── docs/                              # Team split and API contracts
└── docker-compose.yml
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20.19+ or 22.12+
- Docker Desktop with Docker Compose

## 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d postgres
```

Check that it is ready:

```bash
docker compose ps
```

Local development credentials (already reflected in the backend default URL):

- Database: `brightloop`
- Username: `brightloop`
- Password: `brightloop_dev`
- Port: `5432`

These are development-only credentials. Change them before any shared or production deployment.

## 2. Run the FastAPI backend (Windows PowerShell)

Open a terminal in the project root:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If PowerShell blocks virtual environment activation, run this for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend URLs:

- API root: http://localhost:8000/
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health
- API + database status: http://localhost:8000/api/v1/system/status

## 3. Run the React frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173.

The dashboard calls the backend status endpoint and displays whether FastAPI and PostgreSQL are reachable. Navigation items currently open placeholder pages.

## 4. Stop PostgreSQL

```bash
docker compose down
```

To also delete the local development database volume (this permanently removes its data):

```bash
docker compose down -v
```

## Team ownership and integration

The agreed work split is documented in [`docs/TEAM_DIVISION.md`](docs/TEAM_DIVISION.md). Use [`docs/MODULE_OWNERSHIP_MAP.md`](docs/MODULE_OWNERSHIP_MAP.md) for folder ownership and [`docs/INTEGRATION_CONTRACTS.md`](docs/INTEGRATION_CONTRACTS.md) for API handoffs and shared data conventions. Read all three before creating feature branches.

### Final three-person allocation

- **Person 1 — Identity, Catalog and Plans:** authentication, RBAC, customer portal shell, products/variants, plans, quotation templates, seed data and project documentation.
- **Person 2 — Subscriptions and Invoicing Engine:** quotation conversion, subscription lifecycle, recurring/idempotent invoice generation, tax rules, invoice operations and customer-facing APIs.
- **Person 3 — Discounts, Payments and Reporting:** discount rules/calculation hook, payments, partial/full payment state, overdue tracking, financial reports and performance optimization.

Each member owns the frontend, backend, database changes/migrations and tests for their scope. The starter includes separate backend routers and frontend feature folders for these owners. Business features are not implemented yet.

Suggested branches:

- `feature/person-1-identity-catalog-plans`
- `feature/person-2-subscriptions-invoicing`
- `feature/person-3-discounts-payments-reporting`

Each member owns the frontend, backend, database changes, migrations and tests for their assigned module. Keep `main` stable and merge through reviewed pull requests. Do not edit another member's implementation directly; agree on API contracts and request cross-module changes through issues or pull requests.

## Current scope

Included: shared React shell, navigation placeholders, FastAPI app, CORS, configuration, SQLAlchemy engine/session dependency, PostgreSQL service, health/status endpoints, isolated module routers, frontend feature folders, team ownership map, integration contracts and local setup instructions.

Not implemented yet: authentication, user roles, business entities, quotations, subscription lifecycle, tax/discount rules, recurring invoice generation, payment processing and financial reports. These are intentionally left to the three owners defined in `docs/TEAM_DIVISION.md`.
