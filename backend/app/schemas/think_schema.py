from typing import Dict, List, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field

from app.schemas.event_schema import EventModel, TemplateModel


class ThinkRequest(BaseModel):
    event_id: UUID = Field(
        description="The unique identifier of the event being targeted.",
        examples=["123e4567-e89b-12d3-a456-426614174000"],
    )
    message: str = Field(
        description="The natural language command or message from the user workspace interface.",
        examples=["Can you change the event type to wedding and add photography step?"],
    )


class ThinkResponse(BaseModel):
    content: str = Field(
        description="The conversational markdown message from the AI core."
    )
    updated_state: EventModel | TemplateModel = Field(
        description="The complete, updated JSON representation of the event entity row.",
    )


class EventDataStructure(BaseModel):
    type: Optional[str] = Field(
        default="", description="Event type descriptor (e.g. birthday, wedding)."
    )
    theme: Optional[str] = Field(
        default="", description="The aesthetic visual design profile style."
    )
    budget: Optional[int] = Field(
        default=0, description="Total financial allocation value."
    )
    guest_count: Optional[int] = Field(
        default=0, description="Total absolute guest headcount."
    )
    progress_percentage: Optional[int] = Field(
        default=0, description="The execution progress bar scale from 0 to 100."
    )
    status: Optional[str] = Field(
        default="Planning",
        description="Current lifecycle stage tracking token (e.g., Planning, Active).",
    )
    timezone: Optional[ZoneInfo] = Field(default=None, description="The IANA timezone")
    startDateTime: Optional[str] = Field(
        default="", description="ISO local timestamp layout for start tracking."
    )
    endDateTime: Optional[str] = Field(
        default="", description="ISO local timestamp layout for end tracking."
    )
    venueName: Optional[str] = Field(
        default="", description="Descriptive venue facility name."
    )
    venueAddress: Optional[str] = Field(
        default="", description="Physical location address mapping."
    )
    currency: Optional[str] = Field(
        default="INR", description="Currency designator string token (USD, INR)."
    )
    notes: Optional[str] = Field(
        default="", description="Logistical descriptions and text data."
    )

    model_config = {"extra": "allow"}


class ThinkStructure(BaseModel):
    content: str = Field(
        description="Conversational calm text response to the user explaining structural modifications."
    )
    update_detected: bool = Field(
        description="Set to true if the user explicitly asked to alter, append, or purge workspace elements."
    )
    new_title: Optional[str] = Field(
        default=None, description="Updated master event title text string if modified."
    )
    new_data: Optional[EventDataStructure] = Field(
        default=None,
        description="The full updated dictionary payload for the event parameters object.",
    )
    new_flow: Optional[Dict[str, List[str]]] = Field(
        default=None,
        description="The full updated workflow layout tracking category allocations. Example: {'photography': ['vendor-uuid']}",
    )
