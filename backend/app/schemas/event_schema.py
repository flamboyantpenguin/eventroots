from typing import Literal

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
    title: str = Field(min_length=1)
    status: EventStatus = "Planning"
    progress: str = "0%"
    image: str = ""


class EventUpdate(BaseModel):
    title: str | None = None
    status: EventStatus | None = None
    progress: str | None = None
    image: str | None = None
