from fastapi import APIRouter
from pydantic import BaseModel
import psycopg2

from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


def get_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="erdb0",
        user="postgres",
        password="1234"
    )


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


@router.get("")
def get_users():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, username, email, is_active, created_at, updated_at, last_online
        FROM users
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    users = []

    for row in rows:
        users.append({
            "id": str(row[0]),
            "username": row[1],
            "email": row[2],
            "is_active": row[3],
            "created_at": str(row[4]),
            "updated_at": str(row[5]),
            "last_online": str(row[6])
        })

    return {
        "status": "success",
        "users": users
    }


@router.post("")
def create_user(body: UserCreate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO users (username, email, hashed_password)
        VALUES (%s, %s, %s)
        RETURNING id, username, email
    """, (
        body.username,
        body.email.lower(),
        hash_password(body.password)
    ))

    row = cur.fetchone()
    conn.commit()

    cur.close()
    conn.close()

    return {
        "status": "success",
        "message": "User generated",
        "data": {
            "user_id": str(row[0]),
            "username": row[1],
            "email": row[2]
        }
    }


@router.delete("/{user_id}")
def delete_user(user_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM users
        WHERE id = %s
        RETURNING id
    """, (user_id,))

    row = cur.fetchone()
    conn.commit()

    cur.close()
    conn.close()

    if not row:
        return {
            "status": "error",
            "message": "User not found"
        }

    return {
        "status": "success",
        "message": "User identity successfully purged."
    }