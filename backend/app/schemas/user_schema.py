from typing import Literal

from pydantic import BaseModel, EmailStr, Field

UserStatus = Literal["active", "inactive"]


class UserBase(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    event: str = Field(min_length=1)
    status: UserStatus = "active"


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    event: str | None = None
    status: UserStatus | None = None


class UserResponse(UserBase):
    id: int
