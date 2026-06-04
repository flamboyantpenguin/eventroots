from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ThinkRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    event_title: str | None = None


class ThinkResponse(BaseModel):
    role: str = "assistant"
    content: str
