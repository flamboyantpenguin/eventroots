from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from google.genai import types

from app.api.auth import get_current_user_claims
from app.schemas.auth_schema import ClaimModel
from app.schemas.think_schema import ThinkRequest, ThinkResponse, ThinkStructure
from app.store.db import db
from app.utils.response import success

router = APIRouter(prefix="/think", tags=["think"])

client = genai.Client()

SYSTEM_INSTRUCTION = """
You are the advanced intelligence core for an event management aggregator platform with AI assistance for users.
You analyze incoming user requests alongside the true data state of their active event workspace canvas.

You have access to the master global catalog for 'available_categories' and 'available_vendors'.

Your job is twofold:
1. Provide a calm, collaborative text summary in 'content' explaining what adjustments you are making.
2. If the user wants to adjust, update, add, or delete something in their event layout details or flow configuration, you MUST extract and provide the FULL brand-new updated version of that block.

Rules for updates:
- If an update occurs, set 'update_detected' to true.
- If 'title' changes, provide it in 'new_title'.
- If event details (type, budget, etc.) change, provide the COMPLETE update object in 'new_data'.
- If the workflow layers change, provide the COMPLETE update dictionary layout in 'new_flow'.
- If the user is just chatting or asking a question without making changes, set 'update_detected' to false and keep data fields null.
- Only link vendor IDs that exist inside the provided global catalog ('available_vendors') matching the specific category path. Do not fabricate vendor UUID structures.
- Always preserve parts of the state that the user did not explicitly ask to change.
"""


@router.post("/", response_model=ThinkResponse)
async def chat(
    body: ThinkRequest, claims: ClaimModel = Depends(get_current_user_claims)
):
    user_id_from_claim = claims.user_id
    if not user_id_from_claim:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identification key missing from token claims architecture.",
        )

    text = body.message.strip()
    if not text:
        text = "User did not type anything. Respond with a query"

    try:
        current_event = await db.get_event_by_id(body.event_id)

        if not current_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The requested event workspace could not be located in the database logs.",
            )

        if current_event.user_id != user_id_from_claim:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Workspace token ownership parameters do not match claimant signature.",
            )

        available_categories = await db.categories()
        available_vendors = await db.vendors()

        context_block = f"""
        [CURRENT DATABASE TRUTH SNAPSHOT]
        Event Title: {current_event.title}
        Current 'data' JSONB Data: {current_event.data}
        Current 'flow' JSONB Layout: {current_event.flow}

        [GLOBAL MASTER CATALOG REFERENCES]
        Available Categories: {available_categories}
        Available Vendors: {available_vendors}
        """

        prompt_with_context = f"""
        {context_block}

        User Workspace Command: "{text}"
        """

        response = await client.aio.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt_with_context,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
                response_mime_type="application/json",
                response_json_schema=ThinkStructure.model_json_schema(),
            ),
        )

        print(response.text)
        if not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Received an empty text generation structure from the AI core.",
            )

        ai_result = ThinkStructure.model_validate_json(response.text)

        updates = {}
        final_state = current_event.model_copy()

        if ai_result.update_detected:
            if ai_result.new_title is not None:
                updates["title"] = ai_result.new_title
                final_state.title = ai_result.new_title

            if ai_result.new_data is not None:
                updates["data"] = ai_result.new_data.model_dump(
                    mode="json", exclude_none=True
                )
                final_state.data = updates["data"]

            if ai_result.new_flow is not None:
                updates["flow"] = ai_result.new_flow
                final_state.flow = updates["flow"]

            if updates:
                updated_row = await db.update_event(
                    event_id=body.event_id, updates=updates
                )
                if updated_row:
                    final_state = updated_row

        reply = ThinkResponse(
            content=ai_result.content,
            updated_state=final_state,
        )

        return success(reply.model_dump(mode="json"))

    except HTTPException:
        raise
    except Exception as e:
        print(f"Pipeline processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generative workspace pipeline bottleneck: {str(e)}",
        )
