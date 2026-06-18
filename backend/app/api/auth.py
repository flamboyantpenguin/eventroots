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

from app.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth_schema import (
    AdminLoginRequest,
    ClaimModel,
    PublicLoginRequest,
    PublicSignupRequest,
)
from app.schemas.user_schema import AdminModel, UserModel
from app.store.db import db
from app.utils.response import error, success

public = APIRouter(prefix="/auth", tags=["auth"])
admin = APIRouter(prefix="/admin", tags=["auth"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_admin = OAuth2PasswordBearer(tokenUrl="/api/admin/login")


UPLOAD_PFP = settings.UPLOADS_DIR + "/pfp"
MAX_FILE_SIZE = settings.PFP_MAX_SIZE


async def get_current_user_claims(
    token: str = Depends(oauth2_scheme),
) -> ClaimModel | JSONResponse:
    """Interceptors the bearer header token, decodes it, and returns user claims."""

    if ":" not in token:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid token format. Expected user_id:token",
        )

    user_id, session_token = token.split(":", 1)
    session = await db.get_session(UUID(user_id), session_token)
    if not session:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Token has expired or is invalid.",
        )
    return ClaimModel(user_id=session.user_id, is_admin=session.is_admin)


async def get_current_admin_claims(
    token: str = Depends(oauth2_scheme_admin),
) -> ClaimModel | JSONResponse:
    """Interceptors the bearer header token, decodes it, and returns user claims."""
    if ":" not in token:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid token format. Expected user_id:token",
        )
    user_id, session_token = token.split(":", 1)
    session = await db.get_session(UUID(user_id), token)
    if not session:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Token has expired or is invalid.",
        )
    return ClaimModel(user_id=session.user_id, is_admin=session.is_admin)


def _create_auth_payload(row: UserModel | AdminModel, is_admin=False) -> dict[str, Any]:
    """Generate authentication tracking primitives and return an active context envelope."""

    user = {
        "id": str(row.id),
        "username": row.username if type(row) is UserModel else row.email.split("@")[0],
        "email": row.email,
        "pfp": row.pfp or "/" + UPLOAD_PFP + "/default.jpg",
    }

    token = create_access_token()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "is_admin": is_admin,
    }


@public.post("/signup", status_code=201)
async def signup(body: PublicSignupRequest = Depends()):
    if await db.get_user_by_email(body.email):
        return error(
            message="Email is already registered", status_code=status.HTTP_409_CONFLICT
        )

    hashed = hash_password(body.password)
    avatar_url = "/" + UPLOAD_PFP + "/default.jpg"
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
        file_path = os.path.normpath(os.path.join(UPLOAD_PFP, unique_filename))
        if not file_path.startswith(UPLOAD_PFP):
            return error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Malicious file path detected.",
            )

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(body.pfp.file, buffer)
            avatar_url = f"/{UPLOAD_PFP}/{unique_filename}"
        except Exception:
            return error(
                "Failed to save profile picture to local storage.", status_code=500
            )
        finally:
            body.pfp.file.close()

    try:
        await db.create_user(
            username=body.username,
            email=body.email,
            hashed_password=hashed,
            pfp=avatar_url,
        )
    except Exception:
        if body.pfp and file_path and os.path.exists(file_path):
            os.remove(file_path)

        return error(
            "An unexpected system exception occurred while creating profile",
            status_code=500,
        )

    return success(message="Signup successful")


@public.post("/login")
async def login(body: PublicLoginRequest):
    user_hash = await db.get_user_password_by_email(body.email)

    if not user_hash or not verify_password(body.password, user_hash):
        return error(
            message="Invalid email or password credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    db_row = await db.get_user_by_email(body.email)

    if db_row is not None:
        if not db_row.is_active:
            return error(
                status_code=status.HTTP_401_UNAUTHORIZED,
                message="You are no longer priviged to login",
            )
        payload = _create_auth_payload(db_row)
        await db.create_session(
            user_id=payload["user"]["id"],
            session_token=payload["access_token"],
            expires_at=datetime.now(timezone.utc)
            + timedelta(hours=settings.SESSION_TOKEN_EXPIRY_HOURS),
        )
        return success(data=payload, message="Login successful")

    return error(
        message="Interesting error, contact admin",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@admin.post("/login")
async def admin_login(body: AdminLoginRequest):
    hash = await db.get_admin_password_by_email(body.email)

    if not hash or not verify_password(body.password, hash):
        return error(
            message="Invalid email or password credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    db_row = await db.get_admin_by_email(body.email)

    if db_row is not None:
        payload = _create_auth_payload(db_row, True)
        await db.create_session(
            user_id=payload["user"]["id"],
            session_token=payload["access_token"],
            expires_at=datetime.now(timezone.utc)
            + timedelta(hours=settings.SESSION_TOKEN_EXPIRY_HOURS),
            is_admin=True,
        )
        return success(data=payload, message="Login successful")

    return error(
        message="Interesting error, contact admin",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@admin.delete("/logout")
async def admin_logout(authorization: str | None = Header(None)):
    """Terminate the active session context and invalidate the session for public users"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header context missing or malformed.",
        )

    composite_token = authorization.split(" ")[1]

    if ":" not in composite_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed token format. Expected user_id:token.",
        )

    user_id, token = composite_token.split(":", 1)

    try:
        await db.delete_session(UUID(user_id), token)
    except Exception:
        return error(
            "An unexpected system exception occurred during session revocation.",
            status_code=500,
        )

    return success(message="Logout successful. Session cache invalidated.")


@public.delete("/logout")
async def logout(authorization: str | None = Header(None)):
    """Terminate the active session context and invalidate the session for public users"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header context missing or malformed.",
        )

    composite_token = authorization.split(" ")[1]

    if ":" not in composite_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed token format. Expected user_id:token.",
        )

    user_id, session_token = composite_token.split(":", 1)

    try:
        await db.delete_session(UUID(user_id), session_token)
    except Exception:
        return error(
            "An unexpected system exception occurred during session revocation.",
            status_code=500,
        )

    return success(message="Logout successful. Session cache invalidated.")


@public.get("/me")
async def get_current_active_identity(
    claims: ClaimModel = Depends(get_current_user_claims),
):
    """Fetch the current context identity context using the bearer handshake string."""

    user_profile = await db.get_user_by_id(claims.user_id)
    if not user_profile:
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="User instance could not be found.",
        )

    return success(_create_auth_payload(user_profile, False))


@admin.get("/me")
async def get_current_active_identity_for_admin(
    claims: ClaimModel = Depends(get_current_admin_claims),
):
    """Fetch the current context identity context using the bearer handshake string."""

    user_profile = await db.get_admin_by_id(claims.user_id)
    if not user_profile:
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="User instance could not be found.",
        )

    return success(_create_auth_payload(user_profile, True))
