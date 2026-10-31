# Team Work Allocation — Brightloop Subscription Management System

This is the agreed three-person ownership split. Each member owns the frontend, backend, database changes, validation, and tests for their assigned scope. The percentages below are contribution targets, not commit-count quotas.

## Person 1 — Identity, Catalog and Plans

**Foundation: other modules depend on users, customers, products, and plans.**

### Backend ownership
- Signup with unique email and password rules: more than 8 characters, uppercase, lowercase, and special character.
- Login and password-reset link by registered email.
- RBAC roles: Admin, Internal Staff, Customer.
- Only Admin can create Internal Staff accounts.
- Enforce customer data isolation at the API/service layer.
- Product CRUD: name, type, sales price, cost price, notes.
- Product variants and price adjustments (example: Odoo brand adds 560).
- Plan CRUD: price, daily/weekly/monthly/yearly billing period, minimum quantity, available-from/to dates, auto-close, closable, pausable, renewable flags.
- Quotation-template CRUD: plan/product lines and validity in days.
- Seed data: initial admin and sample catalog records.

### Frontend ownership
- Signup, login, forgot-password and reset-password screens.
- Staff/user administration screens.
- Product, variant, plan, and quotation-template screens.
- Customer portal shell with **My Subscriptions** and **My Invoices** pages. These pages consume Person 2's customer-facing APIs; do not duplicate subscription/invoice business logic in the frontend.

### Other ownership
- Initial repository setup and base project configuration.
- Database seed script and shared README/setup instructions.

### Suggested branch
`feature/person-1-identity-catalog-plans`

---

## Person 2 — Subscriptions and Invoicing Engine

**Core business flow: quotation acceptance, subscription lifecycle, and recurring invoices.**

### Backend ownership
- Subscription creation with generated subscription number, customer, plan, start/expiry dates, payment terms, and order lines.
- Create quotations/subscriptions using Person 1's quotation-template, product, plan, and customer data.
- Subscription status lifecycle: Draft → Quotation → Confirmed → Active → Closed.
- Validate allowed transitions and retain visible status/history.
- Pause, resume, renew, and early-close operations, enforcing plan flags from Person 1.
- Billing-day job: find due active subscriptions and generate invoices with lines, taxes, and totals prefilled.
- Idempotent billing: safe to retry; no duplicate invoices and no silently skipped eligible subscriptions.
- Invoice lifecycle: Draft → Confirmed → Paid, with cancel, send-by-email, and print/PDF operations.
- Admin-configured tax rules and automatic tax calculation on invoice lines.
- Customer-facing subscription and invoice APIs consumed by Person 1's portal UI.

### Frontend ownership
- Quotation-to-subscription workflow screens as needed by internal staff.
- Subscription listing, detail, status/history, and lifecycle action screens.
- Invoice listing, detail, confirm/cancel/send/print actions and PDF view/download.
- Customer-facing API integration support for Person 1's portal pages.

### Suggested branch
`feature/person-2-subscriptions-invoicing`

---

## Person 3 — Discounts, Payments and Reporting

**Money in and visibility: discounts, payment reconciliation, overdue tracking, and finance reporting.**

### Backend ownership
- Admin-only discount rule CRUD: fixed amount or percentage, minimum purchase/quantity, start/end dates, usage limit.
- Discount scope: selected products or whole subscriptions.
- Discount eligibility, usage counting, expiry/exhaustion handling, and automatic application to the next invoice.
- Provide a small, documented discount-calculation hook/service for Person 2's invoice builder. Person 3 owns discount rules/calculation; Person 2 owns invoice creation and final invoice persistence.
- Payment recording against an invoice: method, amount, date, and note.
- Support partial and full payments; update paid amount, outstanding balance, and invoice/payment state consistently.
- Overdue invoice detection and outstanding-vs-paid views.
- Finance dashboard/report APIs: active subscriptions, revenue received, amount owed, overdue invoices, and filters/summary data.
- Performance work: pagination, appropriate database indexes, query optimization, and validation of the under-2-second target with test data.

### Frontend ownership
- Discount rule management screens.
- Payment recording and payment history screens.
- Outstanding/paid/overdue invoice views.
- Finance dashboard, filters, and summary/report views.

### Suggested branch
`feature/person-3-discounts-payments-reporting`

---

## Shared boundaries and handoffs

| Handoff | Provider | Consumer | Contract |
|---|---|---|---|
| Users, roles, customers | Person 1 | Persons 2 and 3 | Stable user/customer IDs and role checks |
| Products, variants, plans | Person 1 | Person 2 | Product/variant/plan IDs, price adjustments, plan policy flags |
| Quotation templates | Person 1 | Person 2 | Template ID, validity, plan reference, product lines |
| Subscriptions and due-billing data | Person 2 | Person 3 (reports); billing engine uses own data | Subscription IDs, status, dates, recurring amount |
| Invoice builder hook | Person 2 | Person 3 | Person 2 calls Person 3 discount service before final invoice totals are saved |
| Invoice/payment data | Person 2 | Person 3 | Invoice IDs, totals, paid amount, balance, due date, status |
| Customer portal APIs | Person 2 | Person 1 | Authenticated current-customer subscription/invoice endpoints |
| Finance summary APIs | Person 3 | Shared dashboard shell | Aggregated report response and filter parameters |

## Rules to prevent merge conflicts

1. Keep `main` as the stable integrated branch. Each member works on their own feature branch and opens pull requests.
2. A member owns the models, schemas, routes, services, migrations, UI pages, and tests for their module.
3. Do not edit another member's module directly. Request a change through an issue or a reviewed pull request.
4. Agree shared entity names, IDs, enums, and API payloads before parallel implementation.
5. Keep cross-module calls behind service interfaces or REST APIs. Do not import another module's internal repository/model implementation.
6. Every endpoint must enforce authorization on the backend. Hiding a button in React is not access control.
7. Each person must contribute frontend, backend, database/migration, and tests in their own scope. Judge balance by complexity and delivered functionality—not raw line counts or commit counts.
8. Merge in this order where dependencies require it: Person 1 foundation → Person 2 subscription/invoicing integration → Person 3 discount/payment/reporting integration. Members can build against agreed schemas/mocks while waiting.

## Suggested milestone sequence

- **M0 — Common foundation:** app runs locally; PostgreSQL connection; health endpoint; React shell; shared naming/API conventions.
- **M1 — Person 1 foundation:** auth/RBAC, customer, product/variant, plan, quotation-template APIs and UI; seed data.
- **M2 — Person 2 core flow:** quotation conversion, subscription lifecycle, tax calculation, idempotent recurring invoice generation, invoice operations and portal APIs.
- **M3 — Person 3 finance flow:** discount service/hook, payments, balances, overdue tracking, reporting and performance checks.
- **M4 — Integration:** end-to-end scenarios, authorization tests, billing retry tests, financial reconciliation, and demo data.
