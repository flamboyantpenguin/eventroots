from fastapi import APIRouter, Header
import psycopg

from app.api.users import get_connection
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.auth_schema import LoginRequest, SignupRequest
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
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO users (username, email, hashed_password)
            VALUES (%s, %s, %s)
            RETURNING id, username, email
            """,
            (body.username, body.email.lower(), hash_password(body.password)),
        )
        row = cur.fetchone()
        conn.commit()
    except psycopg.errors.UniqueViolation:
        conn.rollback()
        return error("Email is already registered", status_code=409)
    finally:
        cur.close()
        conn.close()

    return success(_auth_payload(row), message="Signup successful", status_code=201)


@router.post("/login")
def login(body: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, username, email, hashed_password
        FROM users
        WHERE email = %s AND is_active = TRUE
        """,
        (body.email.lower(),),
    )
    row = cur.fetchone()

    if not row or not verify_password(body.password, row[3]):
        cur.close()
        conn.close()
        return error("Invalid email or password", status_code=401)

    cur.execute("UPDATE users SET last_online = CURRENT_TIMESTAMP WHERE id = %s", (row[0],))
    conn.commit()
    cur.close()
    conn.close()

    return success(_auth_payload(row[:3]), message="Login successful")


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        return error("Missing bearer token", status_code=401)

    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload or not payload.get("sub"):
        return error("Invalid token", status_code=401)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, username, email
        FROM users
        WHERE id = %s AND is_active = TRUE
        """,
        (payload["sub"],),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return error("User not found", status_code=404)

    return success({"user": _format_user(row)})
