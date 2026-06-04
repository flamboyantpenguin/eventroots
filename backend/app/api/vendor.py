from fastapi import APIRouter, Query

from app.database.database import db
from app.schemas.vendor_schema import VendorCreate, VendorResponse, VendorUpdate
from app.utils.response import error, success
from app.utils.validators import is_valid_phone

router = APIRouter(prefix="/vendors", tags=["admin-vendors"])


def _sort_vendors(items: list[dict], sort: str) -> list[dict]:
    field, _, direction = sort.partition("-")
    if field not in {"name", "category", "location"}:
        field = "name"
    reverse = direction == "desc"
    return sorted(items, key=lambda v: (v.get(field) or "").lower(), reverse=reverse)


def _filter_vendors(
    items: list[dict],
    search: str,
    category: str,
    location: str,
) -> list[dict]:
    q = search.strip().lower()
    out = items
    if q:
        out = [
            v
            for v in out
            if q in v["name"].lower() or q in v["location"].lower()
        ]
    if category != "all":
        out = [v for v in out if v["category"] == category]
    if location != "all":
        out = [v for v in out if v["location"] == location]
    return out


@router.get("")
def list_vendors(
    search: str = Query(""),
    category: str = Query("all"),
    location: str = Query("all"),
    sort: str = Query("name-asc"),
):
    filtered = _sort_vendors(_filter_vendors(db.vendors, search, category, location), sort)
    return success([VendorResponse(**v).model_dump() for v in filtered])


@router.get("/meta/categories")
def list_categories():
    categories = sorted({v["category"] for v in db.vendors})
    return success(categories)


@router.get("/meta/locations")
def list_locations():
    locations = sorted({v["location"] for v in db.vendors})
    return success(locations)


@router.post("")
def create_vendor(body: VendorCreate):
    if not is_valid_phone(body.contact):
        return error("Contact must be a 10-digit number", 422)

    vendor = {"id": db._next_vendor_id, **body.model_dump()}
    db._next_vendor_id += 1
    db.vendors.append(vendor)
    return success(VendorResponse(**vendor).model_dump(), status_code=201)


@router.put("/{vendor_id}")
def update_vendor(vendor_id: int, body: VendorUpdate):
    vendor = next((v for v in db.vendors if v["id"] == vendor_id), None)
    if not vendor:
        return error("Vendor not found", 404)

    updates = body.model_dump(exclude_unset=True)
    if "contact" in updates and not is_valid_phone(updates["contact"]):
        return error("Contact must be a 10-digit number", 422)

    vendor.update(updates)
    return success(VendorResponse(**vendor).model_dump())


@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int):
    before = len(db.vendors)
    db.vendors = [v for v in db.vendors if v["id"] != vendor_id]
    if len(db.vendors) == before:
        return error("Vendor not found", 404)
    return success(message="Vendor deleted")
