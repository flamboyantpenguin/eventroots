from fastapi import APIRouter, status

from app.store.db import db
from app.utils.response import error, success

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    if not await db.status():
        return error(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="NOT OK",
            data={"db": "FAILED", "think": "OK"},
        )
    return success(
        message="OK",
        data={"db": "OK", "think": "OK"},
    )
