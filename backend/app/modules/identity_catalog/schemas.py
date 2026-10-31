
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=9, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain a lowercase letter")
        if not any(not c.isalnum() for c in value):
            raise ValueError("Password must contain a special character")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CreateStaffRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=9, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain a lowercase letter")
        if not any(not c.isalnum() for c in value):
            raise ValueError("Password must contain a special character")
        return value
