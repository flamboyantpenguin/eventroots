from fastapi import APIRouter, Query

from app.database.database import db
from app.schemas.user_schema import UserCreate, UserResponse, UserUpdate
from app.utils.response import error, success
from app.utils.validators import is_valid_email

router = APIRouter(prefix="/users", tags=["admin-users"])


def _sort_users(items: list[dict], sort: str) -> list[dict]:
    field, _, direction = sort.partition("-")
    if field not in {"name", "event", "email", "status"}:
        field = "name"
    reverse = direction == "desc"
    return sorted(items, key=lambda u: (u.get(field) or "").lower(), reverse=reverse)


def _filter_users(
    items: list[dict],
    search: str,
    status: str,
    event: str,
) -> list[dict]:
    q = search.strip().lower()
    out = items
    if q:
        out = [
            u
            for u in out
            if q in u["name"].lower() or q in u["email"].lower()
        ]
    if status != "all":
        out = [u for u in out if u["status"] == status]
    if event != "all":
        out = [u for u in out if u["event"] == event]
    return out


@router.get("")
def list_users(
    search: str = Query(""),
    status: str = Query("all"),
    event: str = Query("all"),
    sort: str = Query("name-asc"),
):
    filtered = _sort_users(_filter_users(db.admin_users, search, status, event), sort)
    return success([UserResponse(**u).model_dump() for u in filtered])


@router.post("")
def create_user(body: UserCreate):
    if not is_valid_email(str(body.email)):
        return error("Invalid email", 422)
    if any(u["email"].lower() == str(body.email).lower() for u in db.admin_users):
        return error("Email already exists", 409)

    user = {"id": db._next_admin_user_id, **body.model_dump()}
    db._next_admin_user_id += 1
    db.admin_users.append(user)
    return success(UserResponse(**user).model_dump(), status_code=201)


@router.put("/{user_id}")
def update_user(user_id: int, body: UserUpdate):
    user = next((u for u in db.admin_users if u["id"] == user_id), None)
    if not user:
        return error("User not found", 404)

    updates = body.model_dump(exclude_unset=True)
    if "email" in updates and not is_valid_email(str(updates["email"])):
        return error("Invalid email", 422)
    if "email" in updates and any(
        u["id"] != user_id and u["email"].lower() == str(updates["email"]).lower()
        for u in db.admin_users
    ):
        return error("Email already exists", 409)

    user.update(updates)
    return success(UserResponse(**user).model_dump())


@router.delete("/{user_id}")
def delete_user(user_id: int):
    before = len(db.admin_users)
    db.admin_users = [u for u in db.admin_users if u["id"] != user_id]
    if len(db.admin_users) == before:
        return error("User not found", 404)
    return success(message="User deleted")
