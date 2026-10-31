"""Initialize all application tables."""
from app.database import Base, engine
from app.modules.identity_catalog import models as identity_models  # noqa: F401
from app.modules.subscriptions_invoicing import models as subscription_models  # noqa: F401
from app.modules.finance import models as finance_models  # noqa: F401
Base.metadata.create_all(bind=engine)
