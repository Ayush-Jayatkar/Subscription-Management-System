from fastapi import Depends, HTTPException
from pydantic import BaseModel

from app.modules.identity_catalog.dependencies import (
    get_current_user as get_identity_user,
)


class CurrentUser(BaseModel):
    id: int
    role: str


ROLE_MAPPING = {
    "ADMIN": "admin",
    "INTERNAL_STAFF": "staff",
    "CUSTOMER": "customer",
}


def get_current_user(
    identity_user=Depends(get_identity_user),
):
    role = ROLE_MAPPING.get(identity_user.role)

    if not role:
        raise HTTPException(
            status_code=403,
            detail="Unsupported user role",
        )

    return CurrentUser(
        id=identity_user.id,
        role=role,
    )


def require_role(*roles):
    def dependency(
        user: CurrentUser = Depends(get_current_user),
    ):
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient role",
            )

        return user

    return dependency