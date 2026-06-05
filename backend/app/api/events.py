from fastapi import APIRouter
from pydantic import BaseModel
import psycopg2
import psycopg2.extras

router = APIRouter(prefix="/events", tags=["events"])


def get_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="erdb0",
        user="postgres",
        password="1234"
    )


class EventCreate(BaseModel):
    user_id: str | None = None
    title: str
    banner_url: str | None = None
    data: dict = {}
    flow: dict = {}


class EventUpdate(BaseModel):
    title: str | None = None
    banner_url: str | None = None
    data: dict | None = None
    flow: dict | None = None


@router.get("/templates")
def get_templates():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, banner_url, data, flow, created_at, updated_at
        FROM event_templates
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    templates = []

    for row in rows:
        templates.append({
            "template_id": str(row[0]),
            "name": row[1],
            "banner_url": row[2],
            "data": row[3],
            "flow": row[4],
            "created_at": str(row[5]),
            "updated_at": str(row[6])
        })

    return {
        "status": "success",
        "templates": templates
    }


@router.get("/main")
def get_events():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, user_id, title, banner_url, data, flow, created_at, updated_at
        FROM events
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    events = []

    for row in rows:
        events.append({
            "id": str(row[0]),
            "user_id": str(row[1]) if row[1] else None,
            "title": row[2],
            "banner_url": row[3],
            "data": row[4],
            "flow": row[5],
            "created_at": str(row[6]),
            "updated_at": str(row[7])
        })

    return {
        "status": "success",
        "events": events
    }


@router.get("/{event_id}")
def get_event(event_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, user_id, title, banner_url, data, flow, created_at, updated_at
        FROM events
        WHERE id = %s
    """, (event_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {
            "status": "error",
            "message": "Event not found"
        }

    return {
        "status": "success",
        "event": {
            "id": str(row[0]),
            "user_id": str(row[1]) if row[1] else None,
            "title": row[2],
            "banner_url": row[3],
            "data": row[4],
            "flow": row[5],
            "created_at": str(row[6]),
            "updated_at": str(row[7])
        }
    }


@router.post("/main")
def create_event(body: EventCreate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO events (user_id, title, banner_url, data, flow)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, user_id, title, banner_url, data, flow, created_at, updated_at
    """, (
        body.user_id,
        body.title,
        body.banner_url,
        psycopg2.extras.Json(body.data),
        psycopg2.extras.Json(body.flow)
    ))

    row = cur.fetchone()
    conn.commit()

    cur.close()
    conn.close()

    return {
        "status": "success",
        "message": "Event created",
        "data": {
            "id": str(row[0]),
            "user_id": str(row[1]) if row[1] else None,
            "title": row[2],
            "banner_url": row[3],
            "data": row[4],
            "flow": row[5],
            "created_at": str(row[6]),
            "updated_at": str(row[7])
        }
    }


@router.patch("/main/{event_id}")
def update_event(event_id: str, body: EventUpdate):
    conn = get_connection()
    cur = conn.cursor()

    updates = []
    params = []

    if body.title is not None:
        updates.append("title = %s")
        params.append(body.title)

    if body.banner_url is not None:
        updates.append("banner_url = %s")
        params.append(body.banner_url)

    if body.data is not None:
        updates.append("data = %s")
        params.append(psycopg2.extras.Json(body.data))

    if body.flow is not None:
        updates.append("flow = %s")
        params.append(psycopg2.extras.Json(body.flow))

    if not updates:
        cur.close()
        conn.close()
        return {
            "status": "error",
            "message": "No fields to update"
        }

    params.append(event_id)

    cur.execute(f"""
        UPDATE events
        SET {", ".join(updates)}
        WHERE id = %s
        RETURNING id, title, banner_url, data, flow
    """, params)

    row = cur.fetchone()
    conn.commit()

    cur.close()
    conn.close()

    if not row:
        return {
            "status": "error",
            "message": "Event not found"
        }

    return {
        "status": "success",
        "updated_fields": {
            "id": str(row[0]),
            "title": row[1],
            "banner_url": row[2],
            "data": row[3],
            "flow": row[4]
        }
    }


@router.get("/categories")
def get_categories():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name
        FROM category
        ORDER BY name ASC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    categories = []

    for row in rows:
        categories.append({
            "id": str(row[0]),
            "name": row[1]
        })

    return {
        "status": "success",
        "categories": categories
    }