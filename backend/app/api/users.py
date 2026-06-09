from uuid import UUID

from fastapi import APIRouter, status
from fastapi.param_functions import Depends
from typing_extensions import Optional

from app.api.auth import get_current_user_claims
from app.core.security import hash_password
from app.schemas.user_schema import UserCreate, UserUpdate
from app.store.db import db
from app.utils.response import error, success

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def get_users():
    return {"status": "success", "users": db.users}


@router.post("")
def create_user(body: UserCreate, claims: dict = Depends(get_current_user_claims)):
    user_id_str = claims.get("user_id")
    is_admin = claims.get("is_admin", False)

    if not user_id_str:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Unauthorized. Security signature missing.",
        )

    if not is_admin:
        return error(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied. Action requires administrator privileges or matching identity signature.",
        )

    info = db.get_user_by_email(body.email)
    if info is not None:
        return error("Email is already registered", status_code=409)

    db.create_user(body.username, body.email, hash_password(body.password))
    return {"status": "success", "message": "User generated"}


@router.put("/{user_id}")
def update_user(
    user_id: str, body: UserUpdate, claims: dict = Depends(get_current_user_claims)
):
    user_id_str = claims.get("user_id")
    is_admin = claims.get("is_admin", False)

    if not user_id_str:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Unauthorized. Security signature missing.",
        )

    if not is_admin:
        return error(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied. Action requires administrator privileges.",
        )

    current_user = db.get_user_by_id(UUID(user_id))  # Assuming this helper exists
    if not current_user:
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Target user profile context not found.",
        )

    if body.email and body.email != current_user.get("email"):
        email_check = db.get_user_by_email(body.email)
        if email_check is not None:
            return error(
                status_code=status.HTTP_409_CONFLICT,
                message="Email is already registered to another account.",
            )

    if body.password and body.password.strip():
        final_password_hash = hash_password(body.password)
    else:
        final_password_hash = current_user.get("password_hash")

    updated_name = body.name if body.name is not None else current_user.get("username")
    updated_email = body.email if body.email is not None else current_user.get("email")
    updated_status = (
        body.status if body.status is not None else current_user.get("is_active")
    )

    db.update_user(
        user_id=user_id,
        username=updated_name,
        email=updated_email,
        password_hash=final_password_hash,
        is_active=updated_status,
    )

    return {"status": "success", "message": "User profile updated successfully."}


@router.delete("/{user_id}")
def delete_user(user_id: UUID, claims: dict = Depends(get_current_user_claims)):
    user_id_str = claims.get("user_id")
    is_admin = claims.get("is_admin", False)

    if not user_id_str:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Unauthorized. Security signature missing.",
        )

    try:
        authenticated_user_uuid = UUID(str(user_id_str))
    except ValueError:
        return error(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Malformed security token identity schema.",
        )

    if not is_admin and authenticated_user_uuid != user_id:
        return error(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied. Action requires administrator privileges or matching identity signature.",
        )

    if not db.get_user_by_id(user_id):
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="User profile logs not found.",
        )

    db.set_user_to_be_deleted_by_id(user_id)

    return success(message="User account successfully flagged for termination.")
