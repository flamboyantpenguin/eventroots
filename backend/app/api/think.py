import os
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from google import genai
from google.genai import types

from app.schemas.think_schema import ThinkRequest, ThinkResponse, ThinkStructure
from app.store.db import db
from app.utils.response import success

router = APIRouter(prefix="/think", tags=["think"])

# Initialize Gemini engine client
client = genai.Client()

SYSTEM_INSTRUCTION = """
You are the advanced intelligence core for an event management aggregator platform with AI assistance for users.
You analyze incoming user requests alongside the true data state of their active event workspace canvas.

Your job is twofold:
1. Provide a calm, collaborative text summary in 'content' explaining what adjustments you are making.
2. If the user wants to adjust, update, add, or delete something in their event layout (such as details or flow blocks), you MUST extract and provide the FULL brand-new updated version of that sub-field.

Rules for updates:
- If an update occurs, set 'update_detected' to true and fill out the modified fields completely.
- If the user is just chatting or asking a question without making changes, set 'update_detected' to false and keep the data fields null.
- Always preserve parts of the state that the user did not explicitly ask to change.
"""


@router.post("/", response_model=ThinkResponse)
async def chat(body: ThinkRequest):
    text = body.message.strip()

    if not text:
        text = "User did not type anything. Respond with a query"

    try:
        event_uuid = UUID(str(body.event_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided event_id token structure is an invalid UUID schema.",
        )

    try:
        current_event = db.get_event_by_id(event_uuid)

        if not current_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The requested event workspace could not be located in the database logs.",
            )

        context_block = f"""
        [CURRENT DATABASE TRUTH SNAPSHOT]
        Event Title: {current_event["title"]}
        Current 'data' JSONB Data: {current_event["data"]}
        Current 'flow' JSONB Layout: {current_event["flow"]}
        """

        prompt_with_context = f"""
        {context_block}

        User Workspace Command: "{text}"
        """

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt_with_context,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=ThinkStructure,
            ),
        )

        if not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Received an empty text generation structure from the AI core.",
            )

        print("RAW GEMINI TEXT:", response.text)
        ai_result = ThinkStructure.model_validate_json(response.text)

        final_state = current_event.copy()

        if ai_result.update_detected:
            if ai_result.new_title is not None:
                final_state["title"] = ai_result.new_title

            if ai_result.new_data is not None:
                final_state["data"] = ai_result.new_data.model_dump(
                    mode="json", exclude_none=True
                )
            if ai_result.new_flow is not None:
                final_state["flow"] = ai_result.new_flow.model_dump(
                    mode="json", exclude_none=True
                )

            db.update_event_workspace(
                event_id=event_uuid,
                title=final_state["title"],
                data=final_state["data"],
                flow=final_state["flow"],
            )

        reply = ThinkResponse(
            content=ai_result.content,
            updated_state=final_state,
        )

        return success(reply.model_dump(mode="json"))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generative workspace pipeline bottleneck: {str(e)}",
        )
