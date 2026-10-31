from datetime import date,timedelta
from fastapi import APIRouter,Depends,HTTPException,Query,Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import get_db
from app.modules.subscriptions_invoicing import schemas,services,integrations
from app.modules.subscriptions_invoicing.models import TaxRule,Subscription,Invoice
from app.modules.subscriptions_invoicing.repositories import paginate,subscriptions_query,invoices_query
from app.modules.subscriptions_invoicing.deps import CurrentUser,get_current_user,require_role
from app.modules.subscriptions_invoicing.pdf_email import invoice_pdf,send_invoice_email
router=APIRouter(tags=["Subscriptions and Invoicing"])
staff=require_role("admin","staff"); admin=require_role("admin")
def _sub(db,sid):
    obj=db.get(Subscription,sid)
    if not obj: raise HTTPException(404,"Subscription not found")
    return obj
def _inv(db,iid):
    obj=db.get(Invoice,iid)
    if not obj: raise HTTPException(404,"Invoice not found")
    return obj
def _owner(user,obj):
    if user.role not in ("admin","staff") and user.id!=obj.customer_id: raise HTTPException(403,"Forbidden")
@router.post("/tax-rules",response_model=schemas.TaxRuleOut,status_code=201)
def tax_create(body:schemas.TaxRuleIn,db:Session=Depends(get_db),user:CurrentUser=Depends(admin)):
    obj=TaxRule(**body.model_dump()); db.add(obj)
    try: db.commit()
    except IntegrityError: db.rollback(); raise HTTPException(409,"Tax rule name already exists")
    db.refresh(obj); return obj
@router.get("/tax-rules",response_model=list[schemas.TaxRuleOut])
def tax_list(db:Session=Depends(get_db),user:CurrentUser=Depends(staff)): return list(db.scalars(select(TaxRule).order_by(TaxRule.id.desc())))
@router.patch("/tax-rules/{tid}",response_model=schemas.TaxRuleOut)
def tax_patch(tid:int,body:schemas.TaxRulePatch,db:Session=Depends(get_db),user:CurrentUser=Depends(admin)):
    obj=db.get(TaxRule,tid)
    if not obj: raise HTTPException(404,"Tax rule not found")
    for k,v in body.model_dump(exclude_unset=True).items(): setattr(obj,k,v)
    try: db.commit()
    except IntegrityError: db.rollback(); raise HTTPException(409,"Tax rule name already exists")
    db.refresh(obj); return obj
@router.post("/quotations/from-template",response_model=schemas.SubscriptionOut,status_code=201)
def quote_from_template(body:schemas.QuotationFromTemplateIn,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    tmpl=integrations.get_template(db,body.template_id)
    if not tmpl.get("lines"): raise HTTPException(422,"Quotation template has no lines")
    plan_id=tmpl.get("plan_id")
    if not plan_id: raise HTTPException(422,"Template has no plan")
    expiry=body.start_date
    from dateutil.relativedelta import relativedelta
    lines=[{"product_id":x["product_id"],"quantity":x["quantity"],"tax_rule_id":x.get("tax_rule_id")} for x in tmpl["lines"]]
    payload=schemas.SubscriptionIn(customer_id=body.customer_id,plan_id=plan_id,start_date=body.start_date,payment_terms_days=body.payment_terms_days,lines=lines)
    valid=date.today()+timedelta(days=int(tmpl.get("validity_days",0)))
    obj=services.create_subscription(db,payload,user.id,"QUOTATION",valid,body.template_id); db.commit(); db.refresh(obj); return obj
@router.get("/quotations",response_model=schemas.Page)
def quotations(page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    rows,total=paginate(db,subscriptions_query(statuses=["DRAFT","QUOTATION"]),page,page_size); return {"items":rows,"total":total,"page":page,"page_size":page_size}
@router.get("/quotations/{sid}",response_model=schemas.SubscriptionOut)
def quotation(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid)
    if obj.status not in ("DRAFT","QUOTATION"): raise HTTPException(404,"Quotation not found")
    return obj
@router.post("/subscriptions",response_model=schemas.SubscriptionOut,status_code=201)
def subscription_create(body:schemas.SubscriptionIn,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=services.create_subscription(db,body,user.id); db.commit(); db.refresh(obj); return obj
@router.get("/subscriptions",response_model=schemas.Page)
def subscription_list(status:str|None=None,customer_id:int|None=None,page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    rows,total=paginate(db,subscriptions_query(status,customer_id),page,page_size); return {"items":rows,"total":total,"page":page,"page_size":page_size}
@router.get("/subscriptions/{sid}",response_model=schemas.SubscriptionOut)
def subscription_get(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(get_current_user)):
    obj=_sub(db,sid); _owner(user,obj); return obj
@router.patch("/subscriptions/{sid}",response_model=schemas.SubscriptionOut)
def subscription_patch(sid:int,body:schemas.SubscriptionIn,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid)
    if obj.status!="DRAFT": raise HTTPException(409,"Only DRAFT subscriptions can be edited")
    plan=integrations.get_plan(db,body.plan_id); obj.customer_id=body.customer_id; obj.plan_id=body.plan_id; obj.start_date=body.start_date; obj.expiry_date=body.expiry_date; obj.payment_terms_days=body.payment_terms_days; obj.billing_period=plan["billing_period"]; obj.auto_close=bool(plan.get("auto_close")); obj.lines=services.build_lines(db,body,plan); db.commit(); db.refresh(obj); return obj
@router.post("/subscriptions/{sid}/transition",response_model=schemas.SubscriptionOut)
def subscription_transition(sid:int,body:schemas.TransitionIn,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid)
    if body.to=="CLOSED":
        plan=integrations.get_plan(db,obj.plan_id)
        if not plan.get("closable"): raise HTTPException(409,"Plan does not allow early closure")
    services.transition_subscription(db,obj,body.to,user.id); db.commit(); db.refresh(obj); return obj
@router.post("/subscriptions/{sid}/close",response_model=schemas.SubscriptionOut)
def close(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid); plan=integrations.get_plan(db,obj.plan_id)
    if obj.status=="ACTIVE" and not plan.get("closable"): raise HTTPException(409,"Plan does not allow early closure")
    services.transition_subscription(db,obj,"CLOSED",user.id); db.commit(); return obj
@router.post("/subscriptions/{sid}/pause",response_model=schemas.SubscriptionOut)
def pause(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid); plan=integrations.get_plan(db,obj.plan_id)
    if obj.status!="ACTIVE" or obj.is_paused or not plan.get("pausable"): raise HTTPException(409,"Subscription cannot be paused")
    obj.is_paused=True; db.commit(); db.refresh(obj); return obj
@router.post("/subscriptions/{sid}/resume",response_model=schemas.SubscriptionOut)
def resume(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid)
    if not obj.is_paused: raise HTTPException(409,"Subscription is not paused")
    obj.is_paused=False; db.commit(); db.refresh(obj); return obj
@router.post("/subscriptions/{sid}/renew",response_model=schemas.SubscriptionOut)
def renew(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid); plan=integrations.get_plan(db,obj.plan_id)
    if not plan.get("renewable") or obj.status not in ("ACTIVE","CLOSED"): raise HTTPException(409,"Subscription cannot be renewed")
    obj.expiry_date=services.next_period(obj.expiry_date or obj.start_date,obj.billing_period)
    if obj.status=="CLOSED": obj.status="ACTIVE"; obj.next_billing_date=date.today(); from app.modules.subscriptions_invoicing.models import SubscriptionStatusHistory; obj.history.append(SubscriptionStatusHistory(from_status="CLOSED",to_status="ACTIVE",changed_by=user.id))
    db.commit(); db.refresh(obj); return obj
@router.post("/billing/run")
def billing_run(db:Session=Depends(get_db),user:CurrentUser=Depends(admin)): return services.run_billing(db)
@router.get("/invoices",response_model=schemas.Page)
def invoice_list(status:str|None=None,customer_id:int|None=None,overdue:bool=False,page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    rows,total=paginate(db,invoices_query(status,customer_id,overdue),page,page_size); return {"items":rows,"total":total,"page":page,"page_size":page_size}
@router.post("/invoices/from-subscription/{sid}",response_model=schemas.InvoiceOut,status_code=201)
def invoice_create(sid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_sub(db,sid)
    if obj.status!="ACTIVE" or not obj.next_billing_date: raise HTTPException(409,"Subscription is not due for billing")
    period=obj.next_billing_date
    try:
        with db.begin_nested(): inv=services.create_invoice(db,obj,period); obj.next_billing_date=services.next_period(period,obj.billing_period)
        db.commit(); db.refresh(inv); return inv
    except IntegrityError: db.rollback(); raise HTTPException(409,"already invoiced")
@router.get("/invoices/{iid}",response_model=schemas.InvoiceOut)
def invoice_get(iid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(get_current_user)):
    obj=_inv(db,iid); _owner(user,obj)
    if user.role=="customer" and obj.status=="DRAFT": raise HTTPException(404,"Invoice not found")
    return obj
@router.post("/invoices/{iid}/confirm",response_model=schemas.InvoiceOut)
def invoice_confirm(iid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_inv(db,iid); services.invoice_transition(obj,"CONFIRMED"); db.commit(); db.refresh(obj); return obj
@router.post("/invoices/{iid}/cancel",response_model=schemas.InvoiceOut)
def invoice_cancel(iid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_inv(db,iid)
    if obj.paid_amount>0: raise HTTPException(409,"Paid invoices cannot be cancelled")
    services.invoice_transition(obj,"CANCELLED"); db.commit(); db.refresh(obj); return obj
@router.post("/invoices/{iid}/send")
def invoice_send(iid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(staff)):
    obj=_inv(db,iid)
    if obj.status=="CANCELLED": raise HTTPException(409,"Cancelled invoices cannot be sent")
    result=send_invoice_email(obj,invoice_pdf(obj)); return {"status":result}
@router.get("/invoices/{iid}/pdf")
def invoice_get_pdf(iid:int,db:Session=Depends(get_db),user:CurrentUser=Depends(get_current_user)):
    obj=_inv(db,iid); _owner(user,obj)
    if user.role=="customer" and obj.status=="DRAFT": raise HTTPException(404,"Invoice not found")
    return Response(invoice_pdf(obj),media_type="application/pdf",headers={"Content-Disposition":f'inline; filename="{obj.number}.pdf"'})
@router.get("/me/subscriptions",response_model=schemas.Page)
def me_subscriptions(page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),user:CurrentUser=Depends(get_current_user)):
    rows,total=paginate(db,subscriptions_query(customer_id=user.id),page,page_size); return {"items":rows,"total":total,"page":page,"page_size":page_size}
@router.get("/me/invoices",response_model=schemas.Page)
def me_invoices(page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),user:CurrentUser=Depends(get_current_user)):
    rows,total=paginate(db,invoices_query(customer_id=user.id,exclude_draft=True),page,page_size); return {"items":rows,"total":total,"page":page,"page_size":page_size}

