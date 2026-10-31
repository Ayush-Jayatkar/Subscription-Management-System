from fastapi import Depends, HTTPException
from pydantic import BaseModel
from app.modules.identity_catalog.dependencies import get_current_user as identity_current_user

class CurrentUser(BaseModel):
    id: int
    role: str  # admin | staff | customer

def normalize_role(raw: str) -> str:
    r = (raw or "").strip().lower().replace(" ", "_")
    if r.startswith("admin"): return "admin"
    if "staff" in r: return "staff"
    return "customer"

def get_current_user(user=Depends(identity_current_user)) -> CurrentUser:
    return CurrentUser(id=user.id, role=normalize_role(user.role))

def require_role(*roles):
    def dependency(user: CurrentUser = Depends(get_current_user)):
        if user.role not in roles: raise HTTPException(403, "Insufficient role")
        return user
    return dependency
