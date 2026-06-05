import psycopg
from fastapi import APIRouter, Header

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth_schema import LoginRequest, SignupRequest
from app.store.db import db
from app.utils.response import error, success

router = APIRouter(prefix="/auth", tags=["auth"])


def _format_user(row):
    user_id, username, email = row
    display_name = username or email.split("@")[0]
    return {
        "id": str(user_id),
        "username": username or display_name,
        "email": email,
        "display_name": display_name,
    }


def _auth_payload(row):
    user = _format_user(row)
    token = create_access_token(user["id"], {"email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/signup")
def signup(body: SignupRequest):

    if db.get_user_by_email(body.email):
        return error("Email is already registered", status_code=409)

    try:
        db.create_user(body.username, body.email, hash_password(body.email))
    except Exception as _:
        return error("Something went wrong", status_code=409)

    return success(message="Signup successful", status_code=201)


@router.post("/login")
def login(body: LoginRequest):
    return success(message="Login successful")
