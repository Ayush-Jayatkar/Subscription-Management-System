from sqlalchemy import Table, MetaData, select
from fastapi import HTTPException

def _row(db, table_name, **filters):
    try: table=Table(table_name, MetaData(), autoload_with=db.get_bind())
    except Exception as exc: raise HTTPException(503, f"'{table_name}' table not available yet (Person 1 module not deployed)") from exc
    row=db.execute(select(table).filter_by(**filters)).mappings().first()
    if row is None: raise HTTPException(422, f"{table_name} record not found")
    return dict(row)
def get_plan(db, plan_id): return _row(db,"plans",id=plan_id)
def get_product(db, product_id): return _row(db,"products",id=product_id)
def get_customer(db, customer_id):
    row=_row(db,"users",id=customer_id)
    row["name"]=next((row[k] for k in ("display_name","full_name","name") if row.get(k)),row.get("email",""))
    return row
def get_template(db, template_id):
    template=_row(db,"quotation_templates",id=template_id)
    try: lines=Table("quotation_template_lines",MetaData(),autoload_with=db.get_bind())
    except Exception as exc: raise HTTPException(503,"'quotation_template_lines' table not available yet (Person 1 module not deployed)") from exc
    template["lines"]=[dict(x) for x in db.execute(select(lines).where(lines.c.template_id==template_id)).mappings()]
    return template
def quote_discount(db, subtotal, quantity, product_ids, on_date):
    try:
        from app.modules.finance.services import calculate_discount
        return calculate_discount(db,subtotal,quantity,product_ids,on_date)
    except ImportError: return None
def consume_discount(db, discount_id, invoice_id, amount):
    from app.modules.finance.services import consume_discount as consume
    return consume(db,discount_id,invoice_id,amount)
