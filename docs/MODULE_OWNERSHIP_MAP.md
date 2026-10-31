# Module Ownership Map

Use these folders as the default file ownership boundaries. The full task list and handoffs are in `TEAM_DIVISION.md`; API payloads are in `INTEGRATION_CONTRACTS.md`.

| Member | Backend folder | Frontend folder | Main scope |
|---|---|---|---|
| Person 1 | `backend/app/modules/identity_catalog/` | `frontend/src/features/identity-catalog/` | Identity, RBAC, customer portal shell, catalog, plans, quotation templates, seed data and setup docs |
| Person 2 | `backend/app/modules/subscriptions_invoicing/` | `frontend/src/features/subscriptions-invoicing/` | Quotations workflow, subscription lifecycle, tax rules, recurring billing, invoices and customer-facing APIs |
| Person 3 | `backend/app/modules/finance/` | `frontend/src/features/finance/` | Discounts and invoice discount hook, payments, overdue tracking, finance reports and performance |

## Shared files — coordinate before changing

- `backend/app/main.py`: app creation and router registration; already imports each member's router.
- `backend/app/database.py`: shared SQLAlchemy base, engine and session.
- `backend/app/core/`: shared configuration and security primitives.
- `frontend/src/App.jsx`, `frontend/src/components/`, `frontend/src/styles.css`: shared application shell and styling.
- `docker-compose.yml`, `.env.example`, `README.md`: shared local setup.

Each member should keep their models, schemas, repositories, services, routers, tests, migrations and feature UI inside their owned module wherever practical. Do not import another module's internal repository; use documented service/API contracts.
