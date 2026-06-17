from uuid import UUID

from fastapi import APIRouter, status
from fastapi.param_functions import Depends

from app.api.auth import get_current_user_claims
from app.core.security import hash_password
from app.schemas.auth_schema import ClaimModel
from app.schemas.user_schema import UserCreate, UserUpdate
from app.store.db import db
from app.utils.response import error, success

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def get_users(claims: ClaimModel = Depends(get_current_user_claims)):
    if not claims.is_admin:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Unauthorized. Security signature missing or you are not admin",
        )

    return {"status": "success", "users": await db.users()}


@router.post("")
async def create_user(
    body: UserCreate, claims: ClaimModel = Depends(get_current_user_claims)
):
    is_admin = claims.is_admin

    if not is_admin:
        return error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Unauthorized. You are not admin",
        )

    info = await db.get_user_by_email(body.email)
    if info is not None:
        return error("Email is already registered", status_code=409)

    await db.create_user(body.username, body.email, hash_password(body.password))
    return {"status": "success", "message": "User generated"}


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    claims: ClaimModel = Depends(get_current_user_claims),
):
    print(body)
    is_admin = claims.is_admin

    current_user = await db.get_user_by_id(UUID(user_id))

    if not current_user:
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Target user profile context not found.",
        )

    if not is_admin or str(current_user.id) != user_id:
        return error(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied. You cannot do this action",
        )

    if body.email and body.email != current_user.email:
        email_check = db.get_user_by_email(body.email)
        if email_check is not None:
            return error(
                status_code=status.HTTP_409_CONFLICT,
                message="Email is already registered to another account.",
            )

    if body.password and body.password.strip():
        final_password_hash = hash_password(body.password)
    else:
        final_password_hash = await db.get_user_password_by_email("password_hash")

    updated_name = body.username if body.username is not None else current_user.username
    updated_email = body.email if body.email is not None else current_user.email
    updated_status = (
        body.is_active if body.is_active is not None else current_user.is_active
    )

    await db.update_user(
        user_id=user_id,
        username=updated_name,
        email=updated_email,
        hashed_password=final_password_hash,
        is_active=updated_status,
    )

    return {"status": "success", "message": "User profile updated successfully."}


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID, claims: ClaimModel = Depends(get_current_user_claims)
):
    if not await db.get_user_by_id(user_id):
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="User profile not found.",
        )

    user_id_from_claim = claims.user_id

    if user_id_from_claim != user_id and not claims.is_admin:
        return error(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied. You cannot do this action",
        )

    await db.set_user_to_be_deleted_by_id(user_id)
    await db.delete_all_sessions_of_user(user_id)

    return success(message="User account successfully flagged for termination.")
