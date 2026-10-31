from datetime import date
from sqlalchemy import select,func
from app.modules.subscriptions_invoicing.models import Subscription,Invoice
def paginate(db,stmt,page,page_size):
    total=db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    return list(db.scalars(stmt.offset((page-1)*page_size).limit(page_size)).unique()),total
def subscriptions_query(status=None,customer_id=None,statuses=None):
    stmt=select(Subscription)
    if status: stmt=stmt.where(Subscription.status==status)
    if customer_id is not None: stmt=stmt.where(Subscription.customer_id==customer_id)
    if statuses: stmt=stmt.where(Subscription.status.in_(statuses))
    return stmt.order_by(Subscription.id.desc())
def invoices_query(status=None,customer_id=None,overdue=False,exclude_draft=False):
    stmt=select(Invoice)
    if status: stmt=stmt.where(Invoice.status==status)
    if customer_id is not None: stmt=stmt.where(Invoice.customer_id==customer_id)
    if overdue: stmt=stmt.where(Invoice.status=="CONFIRMED",Invoice.due_date<date.today())
    if exclude_draft: stmt=stmt.where(Invoice.status!="DRAFT")
    return stmt.order_by(Invoice.id.desc())
