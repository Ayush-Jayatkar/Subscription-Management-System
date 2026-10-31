# Integration Contracts (Agree Before Parallel Development)

Base API prefix: `/api/v1`. All monetary values should use decimal arithmetic (Python `Decimal` / PostgreSQL `NUMERIC`), not binary floating-point. Use ISO 8601 dates/timestamps and document the currency (default project currency must be agreed by the team).

This document defines proposed contracts, not implemented endpoints. Update it alongside Swagger schemas as the APIs are built.

## Shared rules

- IDs are stable database-generated IDs; consumers store references, not copied business records.
- List endpoints should support pagination (`page`, `page_size`) and deterministic ordering.
- Use consistent error responses and HTTP status codes. Return `401` for unauthenticated, `403` for unauthorized, `404` for missing resources, and `409` for state/conflict/idempotency conflicts.
- Backend authorization is mandatory. Customer endpoints derive the customer identity from the authenticated token; never trust a `customer_id` supplied by the browser to decide ownership.
- Use soft deletion or explicit archive status for referenced catalog records; do not hard-delete records already used in a quotation, subscription, or invoice.

## Person 1 provides

| Area | Proposed endpoint | Consumer/use |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` | User registration and session |
| Staff/RBAC | `POST /users/staff`, `GET /users`, `PATCH /users/{id}/role` | Admin staff management |
| Customers | `GET /customers`, `GET /customers/{id}` | Staff and subscription creation |
| Products | `GET/POST /products`, `GET/PATCH/DELETE /products/{id}` | Product catalog |
| Variants | `POST /products/{id}/variants`, `PATCH /variants/{id}` | Product price adjustment |
| Plans | `GET/POST /plans`, `GET/PATCH/DELETE /plans/{id}` | Plan catalog and lifecycle rules |
| Quote templates | `GET/POST /quotation-templates`, `GET/PATCH/DELETE /quotation-templates/{id}` | Person 2 creates quotations from template |

Useful shared fields:
- Product: `id`, `name`, `type`, `sales_price`, `cost_price`, `notes`, `is_active`.
- Variant: `id`, `product_id`, `attribute_name`, `attribute_value`, `price_adjustment`.
- Plan: `id`, `name`, `price`, `billing_period`, `minimum_quantity`, `available_from`, `available_to`, `auto_close`, `closable`, `pausable`, `renewable`.
- Customer: `id`, `user_id`, `display_name`, `email`, `billing_details` (final fields to be agreed).

## Person 2 provides

| Area | Proposed endpoint | Consumer/use |
|---|---|---|
| Quotations | `POST /quotations/from-template`, `GET /quotations`, `GET /quotations/{id}` | Internal sales flow |
| Subscriptions | `POST /subscriptions`, `GET /subscriptions`, `GET /subscriptions/{id}` | Staff and customer portal |
| Lifecycle | `POST /subscriptions/{id}/transition`, `POST /subscriptions/{id}/pause`, `POST /subscriptions/{id}/resume`, `POST /subscriptions/{id}/renew`, `POST /subscriptions/{id}/close` | Validated lifecycle actions |
| Billing | Internal scheduler/service; optional admin `POST /billing/run` for controlled/manual run | Due invoice generation |
| Invoices | `GET /invoices`, `GET /invoices/{id}`, `POST /invoices/{id}/confirm`, `POST /invoices/{id}/cancel`, `POST /invoices/{id}/send`, `GET /invoices/{id}/pdf` | Staff and customer portal |
| Taxes | `GET/POST /tax-rules`, `PATCH /tax-rules/{id}` | Tax configuration |
| Customer portal | `GET /me/subscriptions`, `GET /me/invoices` | Person 1 portal pages |

Invoice generation must use a stable billing-period key, e.g. `(subscription_id, billing_period_start, billing_period_end)` with a database uniqueness constraint. The scheduled job must run in a transaction and safely handle retries/concurrent workers.

## Person 3 provides

| Area | Proposed endpoint/service | Consumer/use |
|---|---|---|
| Discounts | `GET/POST /discounts`, `PATCH /discounts/{id}`, `POST /discounts/quote` | Admin setup and eligibility preview |
| Invoice hook | `calculate_discount(invoice_context)` service contract | Called by Person 2 invoice builder |
| Payments | `POST /invoices/{id}/payments`, `GET /invoices/{id}/payments`, `GET /payments` | Record/review invoice payments |
| Receivables | `GET /finance/outstanding`, `GET /finance/overdue` | Staff finance operations |
| Reports | `GET /reports/summary`, `GET /reports/revenue`, `GET /reports/subscriptions` | Finance dashboard |

Suggested discount hook input:

```json
{
  "customer_id": 123,
  "subscription_id": 456,
  "currency": "INR",
  "invoice_date": "2026-10-31",
  "lines": [
    {"product_id": 10, "quantity": 5, "unit_price": "560.00", "line_subtotal": "2800.00"}
  ]
}
```

Suggested discount hook output:

```json
{
  "discount_total": "280.00",
  "applied_discounts": [
    {"discount_id": 9, "description": "10% volume discount", "amount": "280.00"}
  ]
}
```

Agree whether discounts are applied before tax (recommended for a consistent taxable base) and whether invoice-level discounts are allocated proportionally to lines. Person 2 owns the final invoice total calculation/persistence; Person 3 owns the discount eligibility/calculation service.

## Shared status and amount conventions

- Subscription statuses: `DRAFT`, `QUOTATION`, `CONFIRMED`, `ACTIVE`, `CLOSED`.
- Invoice statuses: `DRAFT`, `CONFIRMED`, `PAID`, `CANCELLED`. An invoice with partial payment remains `CONFIRMED` (or another agreed outstanding status); balance is derived as `total - paid_amount`.
- Payment statuses/methods should be enums agreed by Person 3 and documented in OpenAPI.
- Do not mark an invoice `PAID` until cumulative successful payments cover the invoice's payable total.
- Keep immutable invoice snapshots of customer/product/tax/discount descriptions and amounts so later catalog changes do not rewrite historical invoices.
