from uuid import UUID

from fastapi import APIRouter

from app.core.security import hash_password
from app.schemas.user_schema import UserCreate
from app.store.db import db
from app.utils.response import error

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def get_users():
    return {"status": "success", "users": db.users}


@router.post("")
def create_user(body: UserCreate):
    info = db.get_user_by_email(body.email)
    if info is not None:
        return error("Email is already registered", status_code=409)

    db.create_user(body.username, body.email, hash_password(body.password))
    return {"status": "success", "message": "User generated"}


@router.delete("/{user_id}")
def delete_user(user_id: UUID):
    if not db.get_user_by_id(user_id):
        return {"status": "error", "message": "User not found"}

    db.set_user_to_be_deleted_by_id(user_id)
    return {"status": "success", "message": "User successfully deleted."}
