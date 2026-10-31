from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator
class InModel(BaseModel): model_config=ConfigDict(extra="forbid")
class OutModel(BaseModel): model_config=ConfigDict(from_attributes=True)
class TaxRuleIn(InModel):
    name: str=Field(min_length=2,max_length=80); rate_percent: Decimal=Field(ge=0,le=100); is_active: bool=True
class TaxRulePatch(InModel):
    name: str|None=Field(None,min_length=2,max_length=80); rate_percent: Decimal|None=Field(None,ge=0,le=100); is_active: bool|None=None
class TaxRuleOut(OutModel): id:int; name:str; rate_percent:Decimal; is_active:bool
class LineIn(InModel): product_id:int; quantity:int=Field(ge=1,le=100000); unit_price:Decimal|None=Field(None,ge=0); tax_rule_id:int|None=None
class SubscriptionIn(InModel):
    customer_id:int; plan_id:int; start_date:date; expiry_date:date|None=None; payment_terms_days:int=Field(15,ge=0,le=365); lines:list[LineIn]=Field(min_length=1)
    @model_validator(mode="after")
    def valid_expiry(self):
        if self.expiry_date is not None and self.expiry_date<=self.start_date: raise ValueError("expiry_date must be after start_date")
        return self
class QuotationFromTemplateIn(InModel): template_id:int; customer_id:int; start_date:date; payment_terms_days:int=Field(15,ge=0,le=365)
class TransitionIn(InModel): to:str=Field(pattern="^(DRAFT|QUOTATION|CONFIRMED|ACTIVE|CLOSED)$")
class HistoryOut(OutModel): id:int; from_status:str|None; to_status:str; changed_by:int|None; changed_at:object
class SubscriptionLineOut(OutModel): id:int; product_id:int; description:str; quantity:int; unit_price:Decimal; tax_rule_id:int|None; amount:Decimal
class SubscriptionOut(OutModel):
    id:int; number:str|None; customer_id:int; plan_id:int; template_id:int|None; start_date:date; expiry_date:date|None; quotation_valid_until:date|None; payment_terms_days:int; status:str; is_paused:bool; billing_period:str; auto_close:bool; next_billing_date:date|None; lines:list[SubscriptionLineOut]; history:list[HistoryOut]
class InvoiceLineOut(OutModel): id:int; product_id:int; description:str; quantity:int; unit_price:Decimal; discount_amount:Decimal; tax_rate:Decimal; line_total:Decimal; tax_amount:Decimal
class InvoiceOut(OutModel):
    id:int; number:str|None; subscription_id:int; customer_id:int; customer_name:str; customer_email:str; billing_period_start:date; billing_period_end:date; invoice_date:date; due_date:date; status:str; subtotal:Decimal; discount_total:Decimal; discount_description:str|None; tax_total:Decimal; total:Decimal; paid_amount:Decimal; lines:list[InvoiceLineOut]
class Page(BaseModel): items:list[SubscriptionOut | InvoiceOut]; total:int; page:int; page_size:int

