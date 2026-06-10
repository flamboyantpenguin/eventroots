from fastapi import APIRouter, Depends

from app.api.auth import get_current_user_claims
from app.store.db import db
from app.utils.response import success

router = APIRouter(prefix="/vendor", tags=["vendor"])


@router.get("")
async def get_vendors(_=Depends(get_current_user_claims)):
    return success(data={"vendors": await db.vendors()})
