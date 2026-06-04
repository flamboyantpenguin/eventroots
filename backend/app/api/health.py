from fastapi import APIRouter

from app.utils.response import success

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    return success({"status": "ok", "service": "eventroots-api"})
