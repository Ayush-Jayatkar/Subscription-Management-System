
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.modules.identity_catalog.dependencies import get_current_user
from app.database import get_db
from app.modules.identity_catalog.models import User, Customer
from app.modules.identity_catalog.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.modules.identity_catalog.security import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(tags=["Identity & Catalog"])


@router.post("/auth/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = data.email.lower()

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = User(
        full_name=data.full_name,
        email=email,
        password_hash=hash_password(data.password),
        role="CUSTOMER",
    )

    db.add(user)
    db.flush()

    customer = Customer(
        user_id=user.id,
        display_name=data.full_name,
        email=email,
    )

    db.add(customer)
    db.commit()
    db.refresh(user)

    return user


@router.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(user.id, user.role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }

@router.get("/auth/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user