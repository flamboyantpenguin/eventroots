from secrets import token_urlsafe

from argon2 import hash_password as hash
from argon2 import verify_password as verify


def hash_password(password: str) -> str:
    return hash(password.encode("utf-8")).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        verify(hashed.encode("utf-8"), plain.encode("utf-8"))
    except Exception as _:
        return False
    return True


def create_access_token() -> str:
    return token_urlsafe(32)
