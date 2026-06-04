from fastapi import APIRouter

from app.schemas.think_schema import ThinkRequest, ThinkResponse
from app.utils.response import success

router = APIRouter(prefix="/think", tags=["think"])

# Mirrors frontend Desktop.jsx MOCK_BOT_REPLIES until a real LLM is wired.
MOCK_REPLIES: dict[str, str] = {
    "Update Guest List Details": (
        "Opening the Guest Ledger... \n\n"
        "I found **142 confirmed attendees**. Would you like me to filter them by "
        "*Dietary Restrictions* or *Seating Chart clusters*?"
    ),
    "Add a new item to the timeline": (
        "Let's update the itinerary. What time should we slot the new event? \n\n"
        "Standard placement for the *Cake Cutting ceremony* is usually right at "
        "**08:30 PM**, right before the dance floor opens."
    ),
    "Rearrange the evening itinerary": (
        "Understood. Fetching the evening grid...\n\n"
        "I can swap the *First Dance* and the *Toast Speeches*. Doing this gives the "
        "catering team an extra **15 minutes** to prep the main courses."
    ),
    "DEFAULT": (
        "I'm processing that request against the event data nodes right now. \n\n"
        "Everything looks aligned! Let me know if you want to push these updates "
        "live to the layout canvas."
    ),
}


@router.post("/chat")
def chat(body: ThinkRequest):
    text = body.message.strip()
    content = MOCK_REPLIES.get(text, MOCK_REPLIES["DEFAULT"])
    if body.event_title:
        content = content.replace("the event", body.event_title)
    reply = ThinkResponse(content=content)
    return success(reply.model_dump())
