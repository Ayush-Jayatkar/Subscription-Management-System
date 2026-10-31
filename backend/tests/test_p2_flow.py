import os
from datetime import date
from pathlib import Path
DB_FILE=Path("p2_test.db")
if DB_FILE.exists(): DB_FILE.unlink()
os.environ["DATABASE_URL"]="sqlite:///./p2_test.db"
os.environ.setdefault("JWT_SECRET_KEY","test-only-not-for-deployment")
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import pytest
from app.database import Base
from app.modules.identity_catalog import models as identity_models
from app.modules.finance import models as finance_models
from app.modules.subscriptions_invoicing import models as p2_models
from app.main import app
engine=create_engine(os.environ["DATABASE_URL"],connect_args={"check_same_thread":False})
Base.metadata.create_all(engine)
with engine.begin() as c:
 for table in ["quotation_template_lines","quotation_templates","product_variants","customers","products","plans","users"]: c.execute(text("DROP TABLE IF EXISTS " + table))
with engine.begin() as c:
 c.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR(254), display_name VARCHAR(100))"))
 c.execute(text("CREATE TABLE products (id INTEGER PRIMARY KEY, name VARCHAR(100), sales_price NUMERIC(12,2))"))
 c.execute(text("CREATE TABLE plans (id INTEGER PRIMARY KEY, billing_period VARCHAR(20), minimum_quantity INTEGER, auto_close BOOLEAN, closable BOOLEAN, pausable BOOLEAN, renewable BOOLEAN)"))
 c.execute(text("INSERT INTO users VALUES (1,'admin@example.com','Admin'),(2,'staff@example.com','Staff'),(3,'acme@example.com','Acme Shop'),(4,'other@example.com','Other')"))
 c.execute(text("INSERT INTO products VALUES (1,'Widget',1000)"))
 c.execute(text("INSERT INTO plans VALUES (1,'monthly',1,0,1,1,1),(2,'yearly',1,0,0,0,0)"))
Session=sessionmaker(bind=engine,autoflush=False,expire_on_commit=False)
def override_db():
 db=Session()
 try: yield db
 finally: db.close()
from app.database import get_db
app.dependency_overrides[get_db]=override_db
client=TestClient(app)
def headers(uid=2,role="staff"): return {"X-User-Id":str(uid),"X-Role":role}
def make_sub(customer=3,plan=1,start="2026-10-30",status="DRAFT"):
 tax=client.post("/api/v1/tax-rules",headers=headers(1,"admin"),json={"name":"GST18","rate_percent":"18"})
 if tax.status_code==409: tax=client.get("/api/v1/tax-rules",headers=headers())
 tid=tax.json()[0]["id"] if tax.request.method=="GET" else tax.json()["id"]
 resp=client.post("/api/v1/subscriptions",headers=headers(),json={"customer_id":customer,"plan_id":plan,"start_date":start,"lines":[{"product_id":1,"quantity":2,"tax_rule_id":tid}]})
 assert resp.status_code==201,resp.text
 sid=resp.json()["id"]
 if status!="DRAFT":
  for to in ["QUOTATION","CONFIRMED","ACTIVE"][:["QUOTATION","CONFIRMED","ACTIVE"].index(status)+1]:
   rr=client.post(f"/api/v1/subscriptions/{sid}/transition",headers=headers(),json={"to":to}); assert rr.status_code==200,rr.text
 return sid
def test_lifecycle_and_permissions():
 bad=client.post("/api/v1/subscriptions",headers=headers(),json={"customer_id":3,"plan_id":1,"start_date":"2026-10-30","expiry_date":"2026-10-29","lines":[{"product_id":1,"quantity":1,"tax_rule_id":1}]}); assert bad.status_code==422
 assert client.post("/api/v1/tax-rules",headers=headers(),json={"name":"Tax","rate_percent":18}).status_code==403
 assert client.get("/api/v1/subscriptions",headers=headers(3,"customer")).status_code==403
 sid=make_sub();
 for to in ["QUOTATION","CONFIRMED","ACTIVE"]: assert client.post(f"/api/v1/subscriptions/{sid}/transition",headers=headers(),json={"to":to}).status_code==200
 assert len(client.get(f"/api/v1/subscriptions/{sid}",headers=headers()).json()["history"])==4
 assert client.post(f"/api/v1/subscriptions/{sid}/transition",headers=headers(),json={"to":"ACTIVE"}).status_code==409
 sid2=make_sub(plan=2)
 for to in ["QUOTATION","CONFIRMED","ACTIVE"]: client.post(f"/api/v1/subscriptions/{sid2}/transition",headers=headers(),json={"to":to})
 assert client.post(f"/api/v1/subscriptions/{sid2}/pause",headers=headers()).status_code==409
 assert client.post(f"/api/v1/subscriptions/{sid2}/close",headers=headers()).status_code==409
 assert client.get(f"/api/v1/subscriptions/{sid}",headers=headers(4,"customer")).status_code==403
def test_billing_discount_and_invoice_flow():
 from app.modules.finance.models import Discount
 db=Session(); db.add(Discount(name="Ten percent",discount_type="percentage",value=10,scope="subscription",minimum_purchase=0,minimum_quantity=1,starts_at=date(2026,1,1),usage_limit=None)); db.commit(); db.close()
 sid=make_sub(start=date.today().isoformat(),status="ACTIVE")
 db=Session(); sub=db.get(p2_models.Subscription,sid); from datetime import timedelta; sub.start_date=date.today()-timedelta(days=1); sub.next_billing_date=sub.start_date; db.commit(); db.close()
 one=client.post("/api/v1/billing/run",headers=headers(1,"admin")); assert one.status_code==200,one.text; assert len(one.json()["created"])>=1
 two=client.post("/api/v1/billing/run",headers=headers(1,"admin")); assert two.status_code==200 and not two.json()["created"]
 db=Session(); inv=db.query(p2_models.Invoice).filter_by(subscription_id=sid).first(); assert inv.subtotal==2000 and inv.discount_total==200 and inv.tax_total==324 and inv.total==2124; iid=inv.id; db.close()
 assert client.post(f"/api/v1/invoices/{iid}/confirm",headers=headers()).status_code==200
 assert client.post(f"/api/v1/invoices/{iid}/confirm",headers=headers()).status_code==409
 assert client.post(f"/api/v1/invoices/{iid}/send",headers=headers()).status_code==200
 assert client.get(f"/api/v1/invoices/{iid}/pdf",headers=headers(3,"customer")).headers["content-type"]=="application/pdf"
 assert client.get("/api/v1/me/invoices",headers=headers(3,"customer")).json()["total"]>=1
 assert client.get("/api/v1/me/invoices",headers=headers(4,"customer")).json()["total"]==0
 assert client.get(f"/api/v1/invoices/{iid}",headers=headers(4,"customer")).status_code==403









@pytest.fixture(scope="session",autouse=True)
def cleanup_test_db():
 yield
 engine.dispose()
 if DB_FILE.exists(): DB_FILE.unlink()
