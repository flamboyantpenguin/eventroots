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
    return {
        "status": "success",
        "message": "Event created from template",
        "data": {"id": new_event_id},
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_empty_event(
    body: EventCreateEmpty = EventCreateEmpty(),
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")

    if not isinstance(current_user, dict) or "user_id" not in current_user:
        return current_user

    user_id = UUID(current_user["user_id"])

    id = db.create_event(
        title=body.title if body.title is not None else "",
        banner_url="/static/uploads/templates/default.avif",
        user_id=user_id,
        data=dict(),
        flow=dict(),
    )

    return {
        "status": "success",
        "message": "Empty event initialized",
        "data": {"id": id},
    }


@router.patch("/{event_id}")
def patch_event(
    event_id: UUID,
    body: EventUpdate,
    current_user: dict = Depends(get_current_user_claims),
):
    user_id = UUID(current_user["user_id"])
    print("--- RAW BODY DICT ---", body.model_dump())
    print("--- EXCLUDE UNSET DICT ---", body.model_dump(exclude_unset=True))

    # 1. Get the dict, exclude unset fields
    updates = body.dict(exclude_unset=True)

    # 2. Remove 'id' if present, because we don't want to update the primary key
    updates.pop("id", None)

    # 3. Perform the update
    updated_event = db.update_event(
        event_id=event_id,
        user_id=user_id,
        updates=updates,
    )

    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized")

    return {"status": "success", "event": updated_event}


@router.delete("/{event_id}")
def delete_event(body: EventDelete):
    """Deleted an event"""
    db.delete_event_by_id(body.id)
    if db.get_event_by_id(body.id):
        return error("Event cannot be deleted", status_code=409)
    else:
        return {"status": "success", "message": "Event deleted"}
