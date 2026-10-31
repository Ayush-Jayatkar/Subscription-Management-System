from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
class TaxRule(Base):
    __tablename__ = "tax_rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    rate_percent: Mapped[Decimal] = mapped_column(Numeric(5,2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str | None] = mapped_column(
    "subscription_number",
    String(20),
    unique=True
    )
    customer_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(Integer, nullable=False)
    template_id: Mapped[int | None] = mapped_column(
    "quotation_template_id",
    Integer
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    quotation_valid_until: Mapped[date | None] = mapped_column(Date)
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", index=True, nullable=False)
    is_paused: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    billing_period: Mapped[str] = mapped_column(String(20), nullable=False)
    auto_close: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    next_billing_date: Mapped[date | None] = mapped_column(Date, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan", lazy="selectin")
    history = relationship("SubscriptionStatusHistory", back_populates="subscription", cascade="all, delete-orphan", lazy="selectin", order_by="SubscriptionStatusHistory.id")
class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    tax_rule_id: Mapped[int | None] = mapped_column(ForeignKey("tax_rules.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    subscription = relationship("Subscription", back_populates="lines")
class SubscriptionStatusHistory(Base):
    __tablename__ = "subscription_status_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(20))
    to_status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[int | None] = mapped_column(Integer)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    subscription = relationship("Subscription", back_populates="history")

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Python attribute 'number' maps to the real database column.
    number: Mapped[str | None] = mapped_column(
        "invoice_number",
        String(20),
        unique=True,
    )

    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.id"),
        index=True,
        nullable=False,
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )

    customer_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        default="",
    )

    customer_email: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
        default="",
    )

    billing_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    billing_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[str] = mapped_column(
        String(20),
        default="DRAFT",
        nullable=False,
    )

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    discount_description: Mapped[str | None] = mapped_column(Text)

    tax_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    balance_due: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    lines = relationship(
        "InvoiceLine",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint(
            "subscription_id",
            "billing_period_start",
            "billing_period_end",
            name="uq_invoice_subscription_period",
        ),
        Index("ix_invoice_status_due_date", "status", "due_date"),
    )

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5,2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(
    "amount",
    Numeric(12, 2),
    nullable=False
    )
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12,2), nullable=False)
    invoice = relationship("Invoice", back_populates="lines")
