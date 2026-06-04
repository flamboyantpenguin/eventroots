from fastapi import APIRouter

from app.core.security import create_access_token, hash_password, verify_password
from app.database.database import db
from app.schemas.auth_schema import AuthResponse, AuthUser, LoginRequest, SignupRequest
from app.utils.response import error, success
from app.utils.validators import is_valid_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _find_account_by_email(email: str):
    return next((a for a in db.accounts if a["email"].lower() == email.lower()), None)


@router.post("/signup")
def signup(body: SignupRequest):
    if not is_valid_email(str(body.email)):
        return error("Invalid email", 422)
    if _find_account_by_email(str(body.email)):
        return error("Email already registered", 409)

    account = {
        "id": db._next_account_id,
        "username": body.username.strip(),
        "email": str(body.email).lower(),
        "password_hash": hash_password(body.password),
        "display_name": body.username.strip(),
    }
    db._next_account_id += 1
    db.accounts.append(account)

    token = create_access_token(str(account["id"]), {"email": account["email"]})
    user = AuthUser(
        id=account["id"],
        username=account["username"],
        email=account["email"],
        display_name=account["display_name"],
    )
    return success(AuthResponse(access_token=token, user=user).model_dump(), status_code=201)


@router.post("/login")
def login(body: LoginRequest):
    account = _find_account_by_email(str(body.email))
    if not account or not verify_password(body.password, account["password_hash"]):
        return error("Invalid email or password", 401)

    token = create_access_token(str(account["id"]), {"email": account["email"]})
    user = AuthUser(
        id=account["id"],
        username=account["username"],
        email=account["email"],
        display_name=account["display_name"],
    )
    return success(AuthResponse(access_token=token, user=user).model_dump())
