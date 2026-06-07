from typing import Literal
from uuid import UUID

from pydantic import BaseModel
from pydantic.fields import Field
from typing_extensions import Optional

EventStatus = Literal["Upcoming", "Completed", "Planning"]


class EventCreateFromTemplate(BaseModel):
    template_id: UUID = Field(..., alias="template_id")
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
    id: Optional[str] = None  # Included because your payload has it
    title: str | None = None
    banner_url: str | None = None
    data: dict | None = None
    flow: dict | None = None

    class Config:
        extra = "forbid"


class EventDelete(BaseModel):
    id: UUID
