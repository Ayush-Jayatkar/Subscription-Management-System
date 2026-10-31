from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.finance.models import Discount, DiscountUsage
from app.modules.finance.repositories import DiscountRepository

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


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
    repo.create(discount, payload.product_ids)
    db.commit()
    db.refresh(discount)
    return discount


def calculate_discount(db: Session, subtotal: Decimal, quantity: int,
                        product_ids: list[int], on_date: date):
    """Read-only quote: returns the best eligible discount without consuming usage."""
    repo = DiscountRepository(db)
    best = None
    for rule in repo.find_eligible(on_date, subtotal, quantity):
        if rule.usage_limit is not None and rule.usage_count >= rule.usage_limit:
            continue
        if rule.scope == "product" and not repo.product_ids_for(rule.id).intersection(product_ids):
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


def consume_discount(db: Session, discount_id: int, invoice_id: int, amount: Decimal):
    """Call in Person 2's invoice transaction; unique key prevents duplicate usage."""
    repo = DiscountRepository(db)
    prior = repo.get_usage(discount_id, invoice_id)
    if prior:
        return prior
    rule = repo.get_by_id(discount_id)
    if not rule or not rule.is_active:
        raise HTTPException(409, "Discount is no longer available")
    if rule.usage_limit is not None and rule.usage_count >= rule.usage_limit:
        raise HTTPException(409, "Discount usage limit reached")
    usage = DiscountUsage(discount_id=discount_id, invoice_id=invoice_id, amount=amount)
    rule.usage_count += 1
    repo.add_usage(usage)
    return usage
