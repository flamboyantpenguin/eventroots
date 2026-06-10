from uuid import UUID

from asyncpg.pool import Any
from pydantic import BaseModel, Field, Json


class VendorModel(BaseModel):
    id: UUID
    name: str
    category_name: str
    category_id: UUID
    location: str
    data: Json[Any] | None = Field(default_factory=dict)


class VendorBase(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    location: str = Field(min_length=1)
    contact: str = Field(min_length=10, max_length=10, pattern=r"^\d{10}$")


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    location: str | None = None
    contact: str | None = Field(default=None, pattern=r"^\d{10}$")


class VendorResponse(VendorBase):
    id: int
