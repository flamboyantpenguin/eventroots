from fastapi import APIRouter

from app.store.db import db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/")
def get_categories():
    return {"status": "success", "categories": db.categories}
