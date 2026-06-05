import os

import psycopg
from fastapi import APIRouter, HTTPException, status
from google import genai
from google.genai import types
from psycopg.rows import dict_row

# Import your v2 Pydantic schemas explicitly
from app.schemas.think_schema import ThinkRequest, ThinkResponse, ThinkStructure
from app.utils.response import success

router = APIRouter(prefix="/think", tags=["think"])

# Initialize Gemini engine client
client = genai.Client()

# Grab database URL config context from the system environment
DB_URL = os.getenv("DATABASE_URL")

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

    if not DB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection string configuration is missing on the server backend.",
        )

    try:
        with psycopg.Connection.connect(DB_URL, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT title, data, flow FROM events WHERE id = %s;",
                    (str(body.event_id),),
                )
                current_event = cur.fetchone()

        if not current_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The requested event workspace could not be located in the database logs.",
            )

        # 3. Assemble full context package for Gemini
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

        # 4. Fire the generation payload over to Gemini enforcing Structured Outputs
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

        # 5. Parse Gemini's structured response into validation fields
        print("RAW GEMINI TEXT:", response.text)
        ai_result = ThinkStructure.model_validate_json(response.text)

        # 6. MUTATE & SAVE directly to Postgres if changes are detected
        # Default our final return state to what we pulled from the database
        # 6. MUTATE & SAVE directly to Postgres if changes are detected
        final_state = current_event.copy()

        if ai_result.update_detected:
            # Apply individual structural changes if provided by Gemini
            if ai_result.new_title is not None:
                final_state["title"] = ai_result.new_title

            # 💡 FIX: Use model_dump(mode="json") to completely flatten these objects into primitive dictionaries
            if ai_result.new_data is not None:
                final_state["data"] = ai_result.new_data.model_dump(
                    mode="json", exclude_none=True
                )
            if ai_result.new_flow is not None:
                final_state["flow"] = ai_result.new_flow.model_dump(
                    mode="json", exclude_none=True
                )

            # Run a clean write update operation to sync the database row back to disk
            with psycopg.connect(DB_URL) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE events
                        SET title = %s, data = %s, flow = %s
                        WHERE id = %s;
                        """,
                        (
                            final_state["title"],
                            psycopg.types.json.Json(final_state["data"]),
                            psycopg.types.json.Json(final_state["flow"]),
                            str(body.event_id),
                        ),
                    )

        # 7. Package everything into the expected frontend response layout
        reply = ThinkResponse(
            content=ai_result.content,
            # final_state is now guaranteed to contain purely primitive, serializable dictionaries!
            updated_state=final_state,
        )

        # 🚀 Use Pydantic's native serializer instead of raw json.dumps(reply.__dict__)
        return success(reply.model_dump(mode="json"))

    except HTTPException:
        # Re-raise explicit HTTP exceptions without catching them as generic errors
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generative workspace pipeline bottleneck: {str(e)}",
        )
