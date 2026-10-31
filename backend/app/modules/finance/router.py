from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.finance import models, schemas, services
from app.modules.finance.repositories import DiscountRepository, PaymentRepository

router = APIRouter(tags=["Person 3 – Finance"])


@router.post("/discounts", response_model=schemas.DiscountOut, status_code=201)
def create_discount(payload: schemas.DiscountCreate, db: Session = Depends(get_db)):
    return services.create_discount(db, payload)


@router.get("/discounts", response_model=list[schemas.DiscountOut])
def list_discounts(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
                   db: Session = Depends(get_db)):
    return DiscountRepository(db).list(skip, limit)


@router.post("/discounts/quote", response_model=schemas.DiscountQuote | None)
def quote_discount(payload: schemas.DiscountQuoteRequest, db: Session = Depends(get_db)):
    return services.calculate_discount(
        db, payload.subtotal, payload.quantity, payload.product_ids, payload.on_date
    )


@router.post("/payments", response_model=schemas.PaymentOut, status_code=201)
def record_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    # Invoice existence, ownership, overpayment and status sync require Person 2's invoice service.
    payment = models.Payment(**payload.model_dump())
    repo = PaymentRepository(db)
    repo.create(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments", response_model=list[schemas.PaymentOut])
def list_payments(invoice_id: int | None = None, skip: int = Query(0, ge=0),
                  limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return PaymentRepository(db).list(invoice_id, skip, limit)


@router.get("/reports/summary", response_model=schemas.FinanceSummary)
def finance_summary(db: Session = Depends(get_db)):
    received = PaymentRepository(db).total_received()
    return schemas.FinanceSummary(
        active_subscriptions=0,
        revenue_received=received,
        amount_owed=Decimal("0.00"),
        overdue_invoices=0,
        note="Revenue is live from payments; invoice balances, overdue invoices and active subscriptions need Person 2's models.",
    )
