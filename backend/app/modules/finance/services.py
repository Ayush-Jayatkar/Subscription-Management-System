
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import MetaData, Table, select, update, func
from sqlalchemy.orm import Session

from app.modules.finance.models import Discount, DiscountUsage, Payment
from app.modules.finance.repositories import DiscountRepository, PaymentRepository
from app.modules.subscriptions_invoicing.models import Subscription

CENT = Decimal("0.01")


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def get_invoice_table(db: Session):
    """Reflect the real invoices table, including balance_due."""
    return Table(
        "invoices",
        MetaData(),
        autoload_with=db.get_bind(),
    )


# ---------------- DISCOUNTS ----------------

def create_discount(db: Session, payload):
    repo = DiscountRepository(db)

    discount = Discount(
        name=payload.name,
        description=payload.description,
        discount_type=payload.discount_type,
        value=payload.value,
        scope=payload.scope,
        minimum_purchase=payload.minimum_purchase,
        minimum_quantity=payload.minimum_quantity,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        usage_limit=payload.usage_limit,
    )

    try:
        repo.create(discount, payload.product_ids)
        db.commit()
        db.refresh(discount)
        return discount
    except Exception:
        db.rollback()
        raise


def calculate_discount(
    db: Session,
    subtotal: Decimal,
    quantity: int,
    product_ids: list[int],
    on_date: date,
):
    """Read-only discount quote used by Person 2's invoice builder."""
    repo = DiscountRepository(db)
    best = None

    for rule in repo.find_eligible(on_date, subtotal, quantity):
        if rule.usage_limit is not None and rule.usage_count >= rule.usage_limit:
            continue

        if (
            rule.scope == "product"
            and not repo.product_ids_for(rule.id).intersection(product_ids)
        ):
            continue

        raw = (
            subtotal * rule.value / Decimal("100")
            if rule.discount_type == "percentage"
            else rule.value
        )

        amount = min(money(raw), money(subtotal))

        if best is None or amount > best["discount_amount"]:
            best = {
                "discount_id": rule.id,
                "discount_name": rule.name,
                "discount_amount": amount,
                "final_subtotal": money(subtotal - amount),
            }

    return best


def consume_discount(
    db: Session,
    discount_id: int,
    invoice_id: int,
    amount: Decimal,
):
    """Called inside Person 2's invoice transaction."""
    repo = DiscountRepository(db)

    prior = repo.get_usage(discount_id, invoice_id)
    if prior:
        return prior

    rule = repo.get_by_id(discount_id)

    if not rule or not rule.is_active:
        raise HTTPException(409, "Discount is no longer available")

    if rule.usage_limit is not None and rule.usage_count >= rule.usage_limit:
        raise HTTPException(409, "Discount usage limit reached")

    usage = DiscountUsage(
        discount_id=discount_id,
        invoice_id=invoice_id,
        amount=amount,
    )

    rule.usage_count += 1
    repo.add_usage(usage)

    # Do not commit here. Person 2 owns the invoice transaction.
    return usage


# ---------------- PAYMENTS ----------------

def record_payment(db: Session, payload):
    """
    Record a payment and update invoice balances in one transaction.
    Requires a CONFIRMED invoice.
    """

    invoices = get_invoice_table(db)

    try:
        # Lock the invoice to prevent concurrent overpayments.
        invoice = db.execute(
            select(invoices)
            .where(invoices.c.id == payload.invoice_id)
            .with_for_update()
        ).mappings().first()

        if not invoice:
            raise HTTPException(404, "Invoice not found")

        if invoice["status"] != "CONFIRMED":
            raise HTTPException(
                409,
                f"Payments are not allowed for {invoice['status']} invoices",
            )

        total = money(invoice["total"])
        already_paid = money(invoice["paid_amount"])
        outstanding = money(total - already_paid)
        amount = money(payload.amount)

        if outstanding <= 0:
            raise HTTPException(409, "Invoice is already fully paid")

        if amount > outstanding:
            raise HTTPException(
                400,
                f"Overpayment not allowed. Outstanding amount: {outstanding}",
            )

        new_paid = money(already_paid + amount)
        new_balance = money(total - new_paid)

        payment = Payment(
            invoice_id=payload.invoice_id,
            method=payload.method,
            amount=amount,
            paid_at=payload.paid_at,
            note=payload.note,
            reference=payload.reference,
        )

        db.add(payment)
        db.flush()

        invoice_values = {
            "paid_amount": new_paid,
            "balance_due": new_balance,
        }

        if new_balance == Decimal("0.00"):
            invoice_values["status"] = "PAID"

        db.execute(
            update(invoices)
            .where(invoices.c.id == payload.invoice_id)
            .values(**invoice_values)
        )

        db.commit()
        db.refresh(payment)

        return payment

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


# ---------------- FINANCE REPORTING ----------------

def get_finance_summary(db: Session):
    invoices = get_invoice_table(db)

    revenue = PaymentRepository(db).total_received()

    active_subscriptions = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.status == "ACTIVE")
        .scalar()
        or 0
    )

    outstanding_query = select(
        func.coalesce(func.sum(invoices.c.balance_due), 0)
    ).where(
        invoices.c.status == "CONFIRMED",
        invoices.c.balance_due > 0,
    )

    amount_owed = db.execute(outstanding_query).scalar_one()

    overdue_query = select(
        func.count()
    ).select_from(invoices).where(
        invoices.c.status == "CONFIRMED",
        invoices.c.due_date < date.today(),
        invoices.c.balance_due > 0,
    )

    overdue_count = db.execute(overdue_query).scalar_one()

    return {
        "active_subscriptions": active_subscriptions,
        "revenue_received": money(revenue),
        "amount_owed": money(amount_owed),
        "overdue_invoices": overdue_count or 0,
        "note": "Live figures from subscriptions, invoices and recorded payments.",
    }
