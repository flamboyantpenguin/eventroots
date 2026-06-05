from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

EventStatus = Literal["Upcoming", "Completed", "Planning"]


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
    title: str | None = None
    status: EventStatus | None = None
    progress: str | None = None
    image: str | None = None


class EventDelete(BaseModel):
    id: UUID
