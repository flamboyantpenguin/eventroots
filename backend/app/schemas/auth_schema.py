from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


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
