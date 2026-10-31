from datetime import date,timedelta
from decimal import Decimal,ROUND_HALF_UP
from dateutil.relativedelta import relativedelta
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.modules.subscriptions_invoicing.models import TaxRule,Subscription,SubscriptionLine,SubscriptionStatusHistory,Invoice,InvoiceLine
from app.modules.subscriptions_invoicing import integrations
CENT=Decimal("0.01")
def money(v): return Decimal(v).quantize(CENT,rounding=ROUND_HALF_UP)
TRANSITIONS={"DRAFT":["QUOTATION"],"QUOTATION":["CONFIRMED","DRAFT"],"CONFIRMED":["ACTIVE"],"ACTIVE":["CLOSED"],"CLOSED":[]}
INVOICE_TRANSITIONS={"DRAFT":["CONFIRMED","CANCELLED"],"CONFIRMED":["PAID","CANCELLED"],"PAID":[],"CANCELLED":[]}
def build_lines(db,body,plan):
    result=[]
    for line in body.lines:
        product=integrations.get_product(db,line.product_id)
        if line.quantity<int(plan.get("minimum_quantity") or 1): raise HTTPException(422,"Quantity is below plan minimum")
        tax=db.get(TaxRule,line.tax_rule_id) if line.tax_rule_id else None
        if line.tax_rule_id and not tax: raise HTTPException(422,"Tax rule not found")
        price=money(line.unit_price if line.unit_price is not None else product["sales_price"])
        result.append(SubscriptionLine(product_id=line.product_id,description=product["name"],quantity=line.quantity,unit_price=price,tax_rule_id=line.tax_rule_id,amount=money(price*line.quantity)))
    return result
def create_subscription(db,body,user_id,status="DRAFT",valid_until=None,template_id=None):
    plan=integrations.get_plan(db,body.plan_id)
    sub=Subscription(customer_id=body.customer_id,plan_id=body.plan_id,template_id=template_id,start_date=body.start_date,expiry_date=body.expiry_date,quotation_valid_until=valid_until,payment_terms_days=body.payment_terms_days,status=status,billing_period=plan["billing_period"],auto_close=bool(plan.get("auto_close",False)))
    sub.lines=build_lines(db,body,plan); db.add(sub); db.flush(); sub.number=f"SUB{sub.id:05d}"
    sub.history.append(SubscriptionStatusHistory(from_status=None,to_status="DRAFT",changed_by=user_id))
    if status!="DRAFT": sub.history.append(SubscriptionStatusHistory(from_status="DRAFT",to_status=status,changed_by=user_id))
    db.flush(); return sub
def transition_subscription(db,sub,to,user_id,today=None):
    today=today or date.today(); allowed=TRANSITIONS.get(sub.status,[])
    if to not in allowed: raise HTTPException(409,f"Invalid transition from {sub.status}; allowed: {allowed}")
    if to=="QUOTATION" and not sub.lines: raise HTTPException(422,"Quotation requires at least one line")
    if to=="CONFIRMED" and sub.quotation_valid_until and sub.quotation_valid_until<today: raise HTTPException(409,"Quotation has expired")
    old=sub.status; sub.status=to
    if to=="ACTIVE": sub.next_billing_date=sub.next_billing_date or sub.start_date
    if to=="CLOSED": sub.next_billing_date=None
    sub.history.append(SubscriptionStatusHistory(from_status=old,to_status=to,changed_by=user_id)); db.flush(); return sub
def next_period(value,period):
    delta={"daily":relativedelta(days=1),"weekly":relativedelta(weeks=1),"monthly":relativedelta(months=1),"yearly":relativedelta(years=1)}.get(period)
    if not delta: raise ValueError(f"Unsupported billing period: {period}")
    return value+delta
def create_invoice(db,sub,period_start):
    period_end=next_period(period_start,sub.billing_period)-timedelta(days=1); today=date.today(); cust=integrations.get_customer(db,sub.customer_id)
    subtotal=money(sum((x.amount for x in sub.lines),Decimal("0"))); quantity=sum(x.quantity for x in sub.lines); products=[x.product_id for x in sub.lines]
    quote=integrations.quote_discount(db,subtotal,quantity,products,today); discount=min(money(quote["discount_amount"]),subtotal) if quote else Decimal("0.00")
    invoice=Invoice(subscription_id=sub.id,customer_id=sub.customer_id,customer_name=cust["name"],customer_email=cust["email"],billing_period_start=period_start,billing_period_end=period_end,invoice_date=today,due_date=today+timedelta(days=sub.payment_terms_days),status="DRAFT",subtotal=subtotal,discount_total=discount,discount_description=quote["discount_name"] if quote else None,tax_total=Decimal("0.00"),total=Decimal("0.00"))
    remaining=discount; tax_total=Decimal("0.00")
    for idx,line in enumerate(sub.lines):
        share=remaining if idx==len(sub.lines)-1 else (money(discount*line.amount/subtotal) if subtotal else Decimal("0.00")); remaining-=share
        tax=db.get(TaxRule,line.tax_rule_id) if line.tax_rule_id else None; rate=tax.rate_percent if tax and tax.is_active else Decimal("0.00")
        net=money(line.amount-share); tax_amount=money(net*rate/Decimal("100")); tax_total+=tax_amount
        invoice.lines.append(InvoiceLine(product_id=line.product_id,description=line.description,quantity=line.quantity,unit_price=line.unit_price,discount_amount=share,tax_rate=rate,line_total=net,tax_amount=tax_amount))
    invoice.tax_total = money(tax_total)
    invoice.total = money(subtotal - discount + tax_total)
    invoice.balance_due = invoice.total - invoice.paid_amount

    db.add(invoice)
    if quote and discount: integrations.consume_discount(db,quote["discount_id"],invoice.id,discount)
    return invoice
def run_billing(db,today=None):
    today=today or date.today(); created=[]; already=[]; closed=[]
    subs=db.scalars(select(Subscription).where(Subscription.status=="ACTIVE",Subscription.is_paused.is_(False),Subscription.next_billing_date<=today).order_by(Subscription.id)).all()
    for sub in subs:
        while sub.next_billing_date and sub.next_billing_date<=today and (not sub.expiry_date or sub.next_billing_date<=sub.expiry_date):
            period=sub.next_billing_date
            try:
                with db.begin_nested(): inv=create_invoice(db,sub,period)
                created.append(inv.id)
            except IntegrityError: already.append({"subscription_id":sub.id,"period_start":period.isoformat()})
            sub.next_billing_date=next_period(period,sub.billing_period)
        if sub.auto_close and sub.expiry_date and sub.next_billing_date and sub.next_billing_date>sub.expiry_date:
            transition_subscription(db,sub,"CLOSED",0,today); closed.append(sub.id)
    db.commit(); return {"created":created,"already_billed":already,"auto_closed":closed}
def invoice_transition(invoice,to):
    allowed=INVOICE_TRANSITIONS[invoice.status]
    if to not in allowed: raise HTTPException(409,f"Invalid invoice transition from {invoice.status}; allowed: {allowed}")
    invoice.status=to; return invoice
def sync_paid_status(invoice):
    """Person 3 handoff: after updating paid_amount, call this to mark a fully paid invoice PAID."""
    if invoice.status=="CONFIRMED" and money(invoice.paid_amount)>=money(invoice.total): invoice.status="PAID"
    return invoice
