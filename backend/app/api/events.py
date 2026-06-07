from uuid import UUID

from fastapi import APIRouter
from fastapi.param_functions import Depends
from fastapi.security import OAuth2PasswordBearer
from starlette import status
from starlette.exceptions import HTTPException

from app.api.auth import get_current_user_claims
from app.schemas.event_schema import (
    EventCreateEmpty,
    EventCreateFromTemplate,
    EventDelete,
    EventUpdate,
)
from app.store.db import db
from app.utils.response import error

router = APIRouter(prefix="/events", tags=["events"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.get("/templates")
def get_templates():
    return {"status": "success", "templates": db.templates}


@router.get("/user")
def get_event_by_user(
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")

    user_id = current_user["user_id"]
    row = db.get_event_by_user_id(UUID(user_id))

    if row is None:
        return {"status": "success", "events": []}

    return {"status": "success", "events": row}


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


@router.post("/from-template", status_code=status.HTTP_201_CREATED)
def create_event_by_template(
    body: EventCreateFromTemplate,
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")
    if not isinstance(current_user, dict) or "user_id" not in current_user:
        return current_user

    user_id = UUID(current_user["user_id"])

    template = db.get_template_by_id(body.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    new_event_id = db.create_event(
        title=body.title or template["title"],
        banner_url=template["banner_url"],
        user_id=user_id,
        data=template["data"],
        flow=template["flow"],
    )

    new_event_record = db.get_event_by_id(UUID(new_event_id))

    return new_event_record


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_empty_event(
    body: EventCreateEmpty,
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")

    if not isinstance(current_user, dict) or "user_id" not in current_user:
        return current_user

    user_id = UUID(current_user["user_id"])

    default_data = {
        "type": "Custom",
        "theme": "Default Minimal",
        "budget": 0,
        "guest_count": 0,
        "progress_percentage": 0,
        "status": "Planning",
    }

    default_flow = {"sequence": []}

    id = db.create_event(
        title=body.title,
        banner_url="/static/uploads/templates/default.avif",  # Default graphic fallback
        user_id=user_id,
        data=default_data,
        flow=default_flow,
    )

    return {"status": "success", "message": "Empty event initialized", "id": id}


@router.patch("/{event_id}")
def patch_event(body: EventUpdate) -> dict | None:
    """Dynamically update specific fields of an event and return the updated row."""
    updates = []
    params = []

    # 💡 Build query components using your explicit ::jsonb casting schema style
    for key, value in body.update_fields.items():
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

    params.append(body.id)

    query = f"""
            UPDATE events
            SET {", ".join(updates)}
            WHERE id = %s
            RETURNING id, title, banner_url, data, flow;
        """

    return db._execute_query(query, tuple(params), fetch_all=False)


@router.delete("/{event_id}")
def delete_event(body: EventDelete):
    """Deleted an event"""
    db.delete_event_by_id(body.id)
    if db.get_event_by_id(body.id):
        return error("Event cannot be deleted", status_code=409)
    else:
        return {"status": "success", "message": "Event deleted"}
