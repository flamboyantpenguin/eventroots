from uuid import UUID

from pydantic import BaseModel


class CategoryModel(BaseModel):
    id: UUID
    name: str
