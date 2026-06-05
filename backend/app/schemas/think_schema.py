from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ThinkRequest(BaseModel):
    event_id: UUID = Field(
        description="The unique identifier of the event being targeted.",
        examples=["123e4567-e89b-12d3-a456-426614174000"],
    )
    message: str = Field(
        description="The natural language command or message from the user workspace interface.",
        examples=[
            "Can you change the description text and clear out the current flow canvas?"
        ],
    )


class ThinkResponse(BaseModel):
    content: str = Field(
        description="The conversational markdown message from the AI core."
    )
    updated_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="The complete, updated JSON representation of the event.",
    )


class EventDescStructure(BaseModel):
    budget: Optional[int] = Field(
        default=None, description="The total event financial threshold limit."
    )
    theme: Optional[str] = Field(
        default=None, description="The aesthetic layout style profile."
    )
    notes: Optional[str] = Field(
        default=None, description="Additional contextual metadata instructions."
    )


# 💡 Universal key-value block to represent dynamic JSON properties without using Dict
class KeyValueStructure(BaseModel):
    key: str = Field(description="The property attribute name tag.")
    value: str = Field(
        description="The value string associated with the attribute property."
    )


class FlowNodeStructure(BaseModel):
    id: str = Field(description="Unique node element ID key indicator.")
    type: str = Field(
        description="The functional UI component variant mapping classification."
    )
    # 💡 Completely clean representation that avoids the forbidden additionalProperties flag
    data: Optional[List[KeyValueStructure]] = Field(
        default=None, description="Dynamic parameters assigned to this specific node."
    )


class EventFlowStructure(BaseModel):
    nodes: Optional[List[FlowNodeStructure]] = Field(
        default=None, description="Active array collection of canvas viewport nodes."
    )


class ThinkStructure(BaseModel):
    content: str = Field(description="Conversational text response to the user.")
    update_detected: bool = Field(
        description="Set to true if the user asked to change, add, or delete something in the event layout."
    )
    new_title: Optional[str] = Field(
        default=None, description="Updated event title text if changed."
    )
    new_data: Optional[EventDescStructure] = Field(
        default=None, description="Complete updated 'desc' dataset object."
    )
    new_flow: Optional[EventFlowStructure] = Field(
        default=None, description="Complete updated 'flow' canvas blueprint object."
    )
