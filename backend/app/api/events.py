import os
import shutil
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordBearer

from app.api.auth import get_current_user_claims
from app.config import Settings
from app.schemas.event_schema import (
    EventCreateEmpty,
    EventCreateFromTemplate,
    EventDelete,
    EventUpdate,
)
from app.store.db import db
from app.utils.response import error, success

router = APIRouter(prefix="/events", tags=["events"])

UPLOAD_BANNER = Settings.UPLOAD_BANNER

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.get("/templates")
def get_templates():
    return {"status": "success", "templates": db.templates}


@router.get("/user")
def get_event_by_user(
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")

    user_id = current_user["user_id"]
    row = db.get_event_by_user_id(UUID(user_id))

    if row is None:
        return {"status": "success", "events": []}

    return {"status": "success", "events": row}


@router.get("/{event_id}")
def get_event(event_id: UUID):
    row = db.get_event_by_id(event_id)

    if not row:
        return {"status": "error", "message": "Event not found"}

    return {
        "status": "success",
        "event": {
            "id": event_id,
            "user_id": row["user_id"],
            "title": row["title"],
            "banner_url": row["banner_url"],
            "data": row["data"],
            "flow": row["flow"],
        },
    }


@router.post("/from-template", status_code=status.HTTP_201_CREATED)
def create_event_by_template(
    body: EventCreateFromTemplate,
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")
    if not isinstance(current_user, dict) or "user_id" not in current_user:
        return current_user

    user_id = UUID(current_user["user_id"])

    template = db.get_template_by_id(body.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    new_event_id = db.create_event(
        title=body.title or template["title"],
        banner_url=template["banner_url"],
        user_id=user_id,
        data=template["data"],
        flow=template["flow"],
    )
    return {
        "status": "success",
        "message": "Event created from template",
        "data": {"id": new_event_id},
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_empty_event(
    body: EventCreateEmpty = EventCreateEmpty(),
    current_user: dict = Depends(get_current_user_claims),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User context missing")

    if not isinstance(current_user, dict) or "user_id" not in current_user:
        return current_user

    user_id = UUID(current_user["user_id"])

    id = db.create_event(
        title=body.title if body.title is not None else "",
        banner_url="/static/uploads/templates/default.avif",
        user_id=user_id,
        data=dict(),
        flow=dict(),
    )

    return {
        "status": "success",
        "message": "Empty event initialized",
        "data": {"id": id},
    }


@router.patch("/{event_id}")
def patch_event(
    event_id: UUID,
    body: EventUpdate,
    current_user: dict = Depends(get_current_user_claims),
):
    user_id = UUID(current_user["user_id"])

    updates = body.model_dump(exclude_unset=True)

    updates.pop("id", None)

    if "flow" in updates and updates["flow"]:
        incoming_flow = updates["flow"]

        try:
            incoming_category_ids = {
                UUID(cat_id_str) for cat_id_str in incoming_flow.keys()
            }

            incoming_vendor_ids = set()
            for vendor_list in incoming_flow.values():
                if vendor_list is not None:
                    for v_id_str in vendor_list:
                        incoming_vendor_ids.add(UUID(v_id_str))

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Malformed layout framework payload: All Category keys and Vendor array values must be valid UUID strings.",
            )

        db_categories = db.categories
        db_vendors = db.vendors

        valid_category_ids = {UUID(str(cat["id"])) for cat in db_categories}
        valid_vendor_ids = {UUID(str(vendor["id"])) for vendor in db_vendors}

        invalid_categories = incoming_category_ids - valid_category_ids
        if invalid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category tracking constraint target identifiers: {[str(i) for i in invalid_categories]}. Target missing from system templates.",
            )

        invalid_vendors = incoming_vendor_ids - valid_vendor_ids
        if invalid_vendors:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid vendor tracking constraint target identifiers: {[str(i) for i in invalid_vendors]}. Target missing from system templates.",
            )

    updated_event = db.update_event(
        event_id=event_id,
        user_id=user_id,
        updates=updates,
    )

    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized")

    return {"status": "success", "event": updated_event}


@router.patch("/banner/{event_id}", response_model=None)
async def upload_event_banner(
    event_id: UUID,
    file: UploadFile = File(...),
    claims: dict = Depends(get_current_user_claims),
):
    user_id_str = claims.get("user_id")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized."
        )

    user_uuid = UUID(str(user_id_str))

    # 1. Verify workspace ownership
    current_event = db.get_event_by_id(event_id)
    if not current_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found."
        )
    if current_event.get("user_id") != user_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied."
        )

    # 2. Validate file extension style
    extension = os.path.splitext(str(file.filename))[1].lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image format type."
        )

    file_name = f"{event_id}{extension}"
    file_path = os.path.join(UPLOAD_BANNER, file_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disk write error: {str(e)}",
        )

    banner_url = f"/{file_path}"
    updated_row = db.update_event(
        event_id=event_id, user_id=user_uuid, updates={"banner_url": banner_url}
    )

    return success({"banner_url": banner_url, "updated_state": updated_row})


@router.delete("/{event_id}")
def delete_event(body: EventDelete):
    """Deleted an event"""
    db.delete_event_by_id(body.id)
    if db.get_event_by_id(body.id):
        return error("Event cannot be deleted", status_code=409)
    else:
        return {"status": "success", "message": "Event deleted"}
