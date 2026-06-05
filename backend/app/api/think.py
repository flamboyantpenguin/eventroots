from fastapi import APIRouter

from app.schemas.think_schema import ThinkRequest
from app.utils.response import success

router = APIRouter(prefix="/think", tags=["think"])


@router.post("/chat")
def chat(body: ThinkRequest):
    title = body.event_title or "your event"
    content = (
        f"Guest Ledger updated for {title}. "
        "I can help organize invitees, RSVP status, meal preferences, and follow-up tasks."
    )

    return success({"role": "assistant", "content": content})
