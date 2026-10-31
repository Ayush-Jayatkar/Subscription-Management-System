from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import settings
from app.modules.identity_catalog.router import router as identity_catalog_router
from app.modules.subscriptions_invoicing.router import router as subscriptions_invoicing_router
from app.modules.finance.router import router as finance_router

app = FastAPI(
    title=settings.app_name,
    description="Backend foundation for Brightloop's subscription, billing, and finance platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(identity_catalog_router, prefix=settings.api_v1_prefix)
app.include_router(subscriptions_invoicing_router, prefix=settings.api_v1_prefix)
app.include_router(finance_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    return {"message": "Welcome to Brightloop API", "docs": "/docs"}
