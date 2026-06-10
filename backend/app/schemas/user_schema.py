from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserModel(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    pfp: str | None = None
    is_active: bool
    last_online: datetime


class AdminModel(BaseModel):
    id: UUID
    email: EmailStr
    pfp: str | None = None


class UserBase(BaseModel):
    username: str = Field(min_length=1)
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    event: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserResponse(UserBase):
    id: int
