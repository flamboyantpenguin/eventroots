from datetime import datetime
from uuid import UUID

from fastapi import UploadFile
from fastapi.param_functions import File, Form
from pydantic import BaseModel, EmailStr, Field


class SessionModel(BaseModel):
    user_id: UUID
    is_admin: bool = False
    expires_at: datetime


class ClaimModel(BaseModel):
    user_id: UUID
    is_admin: bool = False


class PublicSignupRequest:
    def __init__(
        self,
        username: str = Form(...),
        email: EmailStr = Form(...),
        password: str = Form(...),
        pfp: UploadFile | None = File(None),
    ):
        self.username = username
        self.email = email
        self.password = password
        self.pfp = pfp


class PublicLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
