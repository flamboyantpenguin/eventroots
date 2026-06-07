from typing import Literal
from uuid import UUID

from pydantic import BaseModel
from typing_extensions import Optional

EventStatus = Literal["Upcoming", "Completed", "Planning"]


class EventCreateFromTemplate(BaseModel):
    title: Optional[str] = None


class EventCreateEmpty(BaseModel):
    title: str


class TemplateResponse(BaseModel):
    title: str
    image: str
    desc: str


class EventResponse(BaseModel):
    id: int
    title: str
    status: EventStatus
    progress: str
    image: str


class EventCreate(BaseModel):
    user_id: str
    title: str
    banner_url: str | None = None
    data: dict
    flow: dict | None = None


class EventUpdate(BaseModel):
    id: str
    update_fields: dict


class EventDelete(BaseModel):
    id: UUID
