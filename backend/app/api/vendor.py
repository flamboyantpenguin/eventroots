from fastapi import APIRouter

from app.store.db import db

router = APIRouter(prefix="/vendor", tags=["vendor"])


@router.get("")
def get_vendors():
    return {"status": "success", "vendors": db.vendors}
