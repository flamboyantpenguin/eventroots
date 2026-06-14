import os
import shutil
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.auth import get_current_user_claims
from app.config import Settings
from app.schemas.auth_schema import ClaimModel
from app.schemas.event_schema import (
    EventCreateEmpty,
    EventCreateFromTemplate,
    EventDelete,
    EventModel,
    EventUpdate,
)
from app.store.db import db
from app.utils.response import error, success

UPLOAD_BANNER = Settings.UPLOAD_BANNER


async def _verify_perms(user_id: UUID | None, event_id: UUID):
    """Internal function for verifying perms"""

    event = await db.get_event_by_id(event_id)

    if event is None:
        return error(
            status_code=status.HTTP_204_UNAUTHORIZED,
            message="This event doesn't exist",
        )

    if event.user_id != user_id:
        return error(status_code=status.HTTP_403_FORBIDDEN, message="Access denied.")


router = APIRouter(prefix="/events", tags=["events"])


@router.get("/templates")
async def get_templates(_=Depends(get_current_user_claims)):
    return {"status": "success", "templates": await db.templates()}


@router.get("/user", response_model=List[EventModel])
async def get_event_by_user(
    claims: ClaimModel = Depends(get_current_user_claims),
):
    if claims.is_admin:
        return error(message="Admin cannot have events", status_code=401)

    row = await db.get_event_by_user_id(claims.user_id)

    if row is None:
        return success(data={"events": []})

    return success(data={"events": row})


@router.get("/{event_id}")
async def get_event(
    event_id: UUID,
    claims: ClaimModel = Depends(get_current_user_claims),
):
    row = await db.get_event_by_id(event_id)

    if not row:
        return error(status_code=status.HTTP_404_NOT_FOUND, message="Event not found")

    if claims.user_id != row.user_id:
        return error(
            status_code=status.HTTP_404_NOT_FOUND,
            message="This event does not exist",
        )

    return success(
        data={
            "event": {
                "id": event_id,
                "user_id": row.user_id,
                "title": row.title,
                "banner_url": row.banner_url,
                "data": row.data,
                "flow": row.flow,
            }
        },
    )


@router.post("/from-template", status_code=status.HTTP_201_CREATED)
async def create_event_by_template(
    body: EventCreateFromTemplate,
    claims: ClaimModel = Depends(get_current_user_claims),
):
    if claims.is_admin:
        return error(message="Admin cannot create events", status_code=401)

    user_id = claims.user_id

    template = await db.get_template_by_id(body.template_id)
    if not template:
        return error(status_code=404, message="Template not found")

    new_event_id = await db.create_event(
        title=body.title or template.title or "Untitled Event",
        banner_url=template.banner_url,
        user_id=user_id,
        data=template.data,
        flow=template.flow,
    )
    return success(message="Event created from template", data={"id": new_event_id})


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_empty_event(
    body: EventCreateEmpty = EventCreateEmpty(),
    claims: ClaimModel = Depends(get_current_user_claims),
):
    if claims.is_admin:
        return error(message="Admin cannot create events", status_code=401)

    user_id = claims.user_id

    id = await db.create_event(
        title=body.title if body.title is not None else "",
        banner_url="/static/uploads/templates/default.avif",
        user_id=user_id,
        data=dict(),
        flow=dict(),
    )

    return success(message="Empty event initialized", data={"id": id})


@router.patch("/{event_id}")
async def patch_event(
    event_id: UUID,
    body: EventUpdate,
    claims: ClaimModel = Depends(get_current_user_claims),
):
    user_id = claims.user_id
    await _verify_perms(user_id, event_id)

    updates = body.model_dump(exclude_unset=True)

    updates.pop("id", None)

    if "flow" in updates and updates["flow"] is not None:
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
            return error(
                status_code=400,
                message="Malformed layout framework payload: All Category keys and Vendor array values must be valid UUID strings.",
            )

        db_categories = await db.categories()
        db_vendors = await db.vendors()

        valid_category_ids = {cat.id for cat in db_categories}
        valid_vendor_ids = {vendor.id for vendor in db_vendors}

        invalid_categories = incoming_category_ids - valid_category_ids
        if invalid_categories:
            return error(
                status_code=400,
                message=f"Invalid category tracking constraint target identifiers: {[str(i) for i in invalid_categories]}. Target missing from system templates.",
            )

        invalid_vendors = incoming_vendor_ids - valid_vendor_ids
        if invalid_vendors:
            return error(
                status_code=400,
                message=f"Invalid vendor tracking constraint target identifiers: {[str(i) for i in invalid_vendors]}. Target missing from system templates.",
            )

    updated_event = await db.update_event(
        event_id=event_id,
        updates=updates,
    )

    if not updated_event:
        return error(status_code=404, message="Event not found or unauthorized")

    return {"status": "success", "event": updated_event}


@router.patch("/banner/{event_id}", response_model=None)
async def upload_event_banner(
    event_id: UUID,
    file: UploadFile = File(...),
    claims: ClaimModel = Depends(get_current_user_claims),
):
    user_uuid = claims.user_id
    await _verify_perms(user_uuid, event_id)

    extension = os.path.splitext(str(file.filename))[1].lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        return error(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Invalid image format type.",
        )

    file_name = f"{event_id}{extension}"
    file_path = os.path.join(UPLOAD_BANNER, file_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Disk write error: {str(e)}",
        )

    banner_url = f"/{file_path}"
    updated_row = await db.update_event(
        event_id=event_id, updates={"banner_url": banner_url}
    )

    return success({"banner_url": banner_url, "updated_state": updated_row})


@router.delete("/{event_id}")
async def delete_event(
    body: EventDelete,
    claims: ClaimModel = Depends(get_current_user_claims),
):
    """Delete an event"""

    await _verify_perms(claims.user_id, body.id)

    await db.delete_event_by_id(body.id)
    if await db.get_event_by_id(body.id):
        return error("Unable to delete event", status_code=409)
    else:
        return {"status": "success", "message": "Event deleted"}
