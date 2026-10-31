from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel
class CurrentUser(BaseModel):
    id: int
    role: str
# Person 1's JWT replaces ONLY get_current_user later.
def get_current_user(x_user_id: int | None = Header(None), x_role: str = Header("customer")):
    if x_user_id is None: raise HTTPException(401, "Missing X-User-Id")
    if x_role not in {"admin", "staff", "customer"}: raise HTTPException(401, "Invalid role")
    return CurrentUser(id=x_user_id, role=x_role)
def require_role(*roles):
    def dependency(user: CurrentUser = Depends(get_current_user)):
        if user.role not in roles: raise HTTPException(403, "Insufficient role")
        return user
    return dependency
