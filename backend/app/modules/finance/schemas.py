from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class DiscountCreate(BaseModel):
    name: str = Field(min_length=2,max_length=120)
    description: str | None = None
    discount_type: Literal["fixed","percentage"]
    value: Decimal = Field(gt=0)
    scope: Literal["product","subscription"] = "subscription"
    product_ids: list[int] = Field(default_factory=list)
    minimum_purchase: Decimal = Field(default=Decimal("0"),ge=0)
    minimum_quantity: int = Field(default=1,ge=1)
    starts_at: date
    ends_at: date | None = None
    usage_limit: int | None = Field(default=None,ge=1)
    @model_validator(mode="after")
    def validate_rule(self):
        if self.discount_type == "percentage" and self.value > 100: raise ValueError("Percentage cannot exceed 100")
        if self.ends_at and self.ends_at < self.starts_at: raise ValueError("End date must be on or after start date")
        if self.scope == "product" and not self.product_ids: raise ValueError("Product-scoped discounts need product IDs")
        return self

class DiscountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:int; name:str; discount_type:str; value:Decimal; scope:str
    minimum_purchase:Decimal; minimum_quantity:int; starts_at:date
    ends_at:date|None; usage_limit:int|None; usage_count:int; is_active:bool

class DiscountQuoteRequest(BaseModel):
    subtotal:Decimal=Field(gt=0)
    quantity:int=Field(default=1,ge=1)
    product_ids:list[int]=Field(default_factory=list)
    on_date:date=Field(default_factory=date.today)

class DiscountQuote(BaseModel):
    discount_id:int; discount_name:str; discount_amount:Decimal; final_subtotal:Decimal

class PaymentCreate(BaseModel):
    invoice_id:int=Field(gt=0)
    method:str=Field(min_length=2,max_length=40)
    amount:Decimal=Field(gt=0)
    paid_at:datetime
    note:str|None=None
    reference:str|None=None 

class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:int; invoice_id:int; method:str; amount:Decimal; paid_at:datetime
    note:str|None; reference:str|None

class FinanceSummary(BaseModel):
    active_subscriptions:int
    revenue_received:Decimal
    amount_owed:Decimal
    overdue_invoices:int
    note:str
