from uuid import UUID

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.schemas.event_schema import EventCreate, EventDelete, EventResponse
from app.store.db import db
from app.utils.response import error

router = APIRouter(prefix="/events", tags=["events"])


class EventUpdate(BaseModel):
    title: str | None = None
    banner_url: str | None = None
    data: dict | None = None
    flow: dict | None = None


@router.get("/templates")
def get_templates():
    return {"status": "success", "templates": db.templates}


@router.get("/{event_id}")
def get_event(event_id: UUID):
    row = db.get_event_by_id(event_id)

    if not row:
        return {"status": "error", "message": "Event not found"}

    return {
        "status": "success",
        "event": {
            "id": event_id,
            "user_id": row["user_id"],
            "title": row["title"],
            "banner_url": row["banner_url"],
            "data": row["data"],
            "flow": row["flow"],
        },
    }


@router.post("/")
def create_event(body: EventCreate):
    id = db.create_event(
        body.title,
        body.banner_url,
        body.user_id,
        body.data,
        body.flow,
    )
    return {"status": "success", "message": "Event created", "id": id}


@router.patch("/{event_id}")
def patch_event(self, event_id: str, update_fields: dict) -> dict | None:
    """Dynamically update specific fields of an event and return the updated row."""
    updates = []
    params = []

    # 💡 Build query components using your explicit ::jsonb casting schema style
    for key, value in update_fields.items():
        if value is not None:
            if key in ("data", "flow"):
                updates.append(f"{key} = %s::jsonb")
                # With psycopg v3, we can pass dicts directly into params!
                params.append(value)
            else:
                updates.append(f"{key} = %s")
                params.append(value)

    if not updates:
        return None

    # Add the lookup parameter for the WHERE clause
    params.append(event_id)

    query = f"""
            UPDATE events
            SET {", ".join(updates)}
            WHERE id = %s
            RETURNING id, title, banner_url, data, flow;
        """

    # Execute query using your dictionary row factory engine
    return self._execute_query(query, tuple(params), fetch_all=False)


@router.delete("/{event_id}")
def delete_event(body: EventDelete):
    """Deleted an event"""
    db.delete_event_by_id(body.id)
    if db.get_event_by_id(body.id):
        return error("Event cannot be deleted", status_code=409)
    else:
        return {"status": "success", "message": "Event deleted"}
