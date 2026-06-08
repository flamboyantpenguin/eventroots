import os
import shutil
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status,
)
from fastapi.security.oauth2 import OAuth2PasswordBearer
from starlette.responses import JSONResponse

from app.config import Settings
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UPLOAD_DIR = Settings.UPLOAD_PFP
ACCESS_PFP = Settings.ACCESS_PFP
MAX_FILE_SIZE = Settings.PFP_MAX_SIZE


def get_current_user_claims(token: str = Depends(oauth2_scheme)) -> dict | JSONResponse:
    """Interceptors the bearer header token, decodes it, and returns user claims."""
    claims = decode_access_token(token)
    if not claims:
        return error("Session expired or token signature is invalid", status_code=401)
    return claims


def _format_user(row: dict[str, Any]) -> dict[str, Any]:
    """Map a raw database dictionary row safely into a presentation-layer schema."""
    user_id = row["id"]
    username = row.get("username")
    email = row["email"]
    pfp = row["pfp"]

    # Clean visual fallback string for names
    display_name = username or email.split("@")[0]

    return {
        "id": str(user_id),
        "username": username or display_name,
        "email": email,
        "pfp": pfp,
    }


def _auth_payload(row: dict[str, Any], is_admin=False) -> dict[str, Any]:
    """Generate authentication tracking primitives and return an active context envelope."""
    user = _format_user(row)

    # Create the immutable cryptographic identity token
    token = create_access_token(subject=user["id"], extra={"is_admin": is_admin})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "is_admin": is_admin,
    }


@router.post("/signup", status_code=201)
def signup(body: SignupRequest = Depends()):
    if db.get_user_by_email(body.email):
        return error(
            "Email is already registered", status_code=status.HTTP_409_CONFLICT
        )

    hashed = hash_password(body.password)
    avatar_url = ACCESS_PFP + "/default.jpg"
    file_path = ""

    if body.pfp and body.pfp.filename:
        file_extension = os.path.splitext(body.pfp.filename)[1].lower()
        if file_extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            return error("Invalid image format extension.", status_code=400)

        file_size = getattr(body.pfp, "size", 0) or len(body.pfp.file.read())

        body.pfp.file.seek(0)

        if file_size > MAX_FILE_SIZE:
            return error("File size exceeds the maximum limit of 5MB.", status_code=413)

        unique_filename = f"{uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(body.pfp.file, buffer)
            avatar_url = f"{ACCESS_PFP}/{unique_filename}"
        except Exception:
            return error(
                "Failed to save profile picture to local storage.", status_code=500
            )
        finally:
            body.pfp.file.close()

    try:
        db.create_user(
            username=body.username,
            email=body.email,
            hashed_password=hashed,
            pfp=avatar_url,
        )
    except Exception:
        if body.pfp and file_path and os.path.exists(file_path):
            os.remove(file_path)

        return error(
            "An unexpected system exception occurred during profiling.", status_code=500
        )

    return success(message="Signup successful")


@router.post("/login")
def login(body: LoginRequest):
    if body.is_admin:
        user_hash = db.get_admin_password_by_email(body.email)
        db_row = db.get_admin_by_email(body.email)
    else:
        user_hash = db.get_user_password_by_email(body.email)
        db_row = db.get_user_by_email(body.email)

    if not user_hash or db_row is None:
        return error(
            "Invalid email or password credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if not verify_password(body.password, user_hash):
        return error(
            "Invalid email or password credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    payload = _auth_payload(db_row, body.is_admin)

    expiry_horizon = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    db.create_session(
        user_id=payload["user"]["id"],
        session_token=payload["access_token"],
        expires_at=expiry_horizon,
    )

    return success(data=payload, message="Login successful")


@router.delete("/logout")
def logout(authorization: str | None = Header(None)):
    """Terminate the active session context and invalidate the transmission token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header context missing or malformed.",
        )

    token = authorization.split(" ")[1]

    try:
        db.delete_session_by_token(token)
    except Exception:
        return error(
            "An unexpected system exception occurred during session revocation.",
            status_code=500,
        )

    return success(message="Logout successful. Session cache invalidated.")


@router.get("/me")
def get_current_active_identity(authorization: str | None = Header(None)):
    """Fetch the current context identity context using the bearer handshake string."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header context missing or malformed.",
        )

    token = authorization.split(" ")[1]

    claims = decode_access_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired or is invalid.",
        )

    user_id = claims["user_id"]
    is_admin = claims["is_admin"]

    user_profile = db.get_user_by_id(UUID(user_id))
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User instance could not be found.",
        )

    return success(_auth_payload(user_profile, is_admin))
