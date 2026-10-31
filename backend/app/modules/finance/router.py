
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.finance import schemas, services
from app.modules.finance.repositories import (
    DiscountRepository,
    PaymentRepository,
)
from app.modules.identity_catalog.dependencies import require_roles

router = APIRouter(tags=["Person 3 - Finance"])


# ---------------- DISCOUNTS ----------------

@router.post(
    "/discounts",
    response_model=schemas.DiscountOut,
    status_code=201,
    dependencies=[Depends(require_roles("ADMIN"))],
)
def create_discount(
    payload: schemas.DiscountCreate,
    db: Session = Depends(get_db),
):
    return services.create_discount(db, payload)


@router.get(
    "/discounts",
    response_model=list[schemas.DiscountOut],
    dependencies=[Depends(require_roles("ADMIN"))],
)
def list_discounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return DiscountRepository(db).list(skip, limit)


@router.post(
    "/discounts/quote",
    response_model=schemas.DiscountQuote | None,
)
def quote_discount(
    payload: schemas.DiscountQuoteRequest,
    db: Session = Depends(get_db),
):
    return services.calculate_discount(
        db,
        payload.subtotal,
        payload.quantity,
        payload.product_ids,
        payload.on_date,
    )


# ---------------- PAYMENTS ----------------

@router.post(
    "/payments",
    response_model=schemas.PaymentOut,
    status_code=201,
    dependencies=[
        Depends(require_roles("ADMIN", "INTERNAL_STAFF"))
    ],
)
def record_payment(
    payload: schemas.PaymentCreate,
    db: Session = Depends(get_db),
):
    return services.record_payment(db, payload)


@router.get(
    "/payments",
    response_model=list[schemas.PaymentOut],
    dependencies=[
        Depends(require_roles("ADMIN", "INTERNAL_STAFF"))
    ],
)
def list_payments(
    invoice_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return PaymentRepository(db).list(invoice_id, skip, limit)


# ---------------- REPORTS ----------------

@router.get(
    "/reports/summary",
    response_model=schemas.FinanceSummary,
    dependencies=[
        Depends(require_roles("ADMIN", "INTERNAL_STAFF"))
    ],
)
def finance_summary(db: Session = Depends(get_db)):
    return services.get_finance_summary(db)
