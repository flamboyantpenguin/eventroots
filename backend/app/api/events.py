from fastapi import APIRouter

from app.database.database import db
from app.schemas.event_schema import EventCreate, EventResponse, EventUpdate, TemplateResponse
from app.utils.response import error, success

router = APIRouter(tags=["events"])


@router.get("/templates")
def list_templates():
    return success([TemplateResponse(**t).model_dump() for t in db.templates])


@router.get("/events")
def list_events():
    return success([EventResponse(**e).model_dump() for e in db.events])


@router.post("/events")
def create_event(body: EventCreate):
    event = {"id": db._next_event_id, **body.model_dump()}
    db._next_event_id += 1
    db.events.append(event)
    return success(EventResponse(**event).model_dump(), status_code=201)


@router.put("/events/{event_id}")
def update_event(event_id: int, body: EventUpdate):
    event = next((e for e in db.events if e["id"] == event_id), None)
    if not event:
        return error("Event not found", 404)
    event.update(body.model_dump(exclude_unset=True))
    return success(EventResponse(**event).model_dump())


@router.delete("/events/{event_id}")
def delete_event(event_id: int):
    before = len(db.events)
    db.events = [e for e in db.events if e["id"] != event_id]
    if len(db.events) == before:
        return error("Event not found", 404)
    return success(message="Event deleted")
