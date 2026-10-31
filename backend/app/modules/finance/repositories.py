from __future__ import annotations
from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.finance.models import Discount, DiscountProduct, DiscountUsage, Payment


class DiscountRepository:
    """Database access for discount rules and their usage records."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, discount: Discount, product_ids: List[int] | None = None) -> Discount:
        self.db.add(discount)
        self.db.flush()
        for product_id in product_ids or []:
            self.db.add(DiscountProduct(discount_id=discount.id, product_id=product_id))
        self.db.flush()
        return discount

    def get_by_id(self, discount_id: int) -> Discount | None:
        return self.db.get(Discount, discount_id)

    def list(self, skip: int = 0, limit: int = 10) -> List[Discount]:
        stmt = select(Discount).order_by(Discount.id.desc()).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def find_eligible(self, on_date, subtotal, quantity) -> List[Discount]:
        stmt = select(Discount).where(
            Discount.is_active.is_(True),
            Discount.starts_at <= on_date,
            (Discount.ends_at.is_(None) | (Discount.ends_at >= on_date)),
            Discount.minimum_purchase <= subtotal,
            Discount.minimum_quantity <= quantity,
        )
        return list(self.db.scalars(stmt).all())

    def product_ids_for(self, discount_id: int) -> set[int]:
        stmt = select(DiscountProduct.product_id).where(
            DiscountProduct.discount_id == discount_id
        )
        return set(self.db.scalars(stmt).all())

    def get_usage(self, discount_id: int, invoice_id: int):
        stmt = select(DiscountUsage).where(
            DiscountUsage.discount_id == discount_id,
            DiscountUsage.invoice_id == invoice_id,
        )
        return self.db.scalar(stmt)

    def add_usage(self, usage: DiscountUsage) -> None:
        self.db.add(usage)
        self.db.flush()


class PaymentRepository:
    """Database access for payments and payment aggregates."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def list(self, invoice_id: int | None = None, skip: int = 0, limit: int = 20) -> list[Payment]:
        stmt = select(Payment).order_by(Payment.paid_at.desc())
        if invoice_id is not None:
            stmt = stmt.where(Payment.invoice_id == invoice_id)
        return list(self.db.scalars(stmt.offset(skip).limit(limit)).all())

    def total_received(self):
        return self.db.scalar(select(func.coalesce(func.sum(Payment.amount), 0))) or 0
