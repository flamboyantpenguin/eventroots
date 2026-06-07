from fastapi import UploadFile
from fastapi.param_functions import File, Form
from pydantic import BaseModel, EmailStr, Field


class SignupRequest:
    def __init__(
        self,
        username: str = Form(...),
        email: str = Form(...),
        password: str = Form(...),
        pfp: UploadFile | None = File(None),
    ):
        self.username = username
        self.email = email
        self.password = password
        self.pfp = pfp


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    is_admin: bool = Field(default=False)


class AuthUser(BaseModel):
    id: str
    username: str
    email: str
    display_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
