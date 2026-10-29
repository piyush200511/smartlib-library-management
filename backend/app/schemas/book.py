from pydantic import BaseModel
from typing import Optional


class BookCreate(BaseModel):
    isbn: str
    title: str
    author: str
    category: str
    total_copies: int = 1
    rack_no: Optional[str] = None


class BookOut(BookCreate):
    id: int
    available_copies: int

    class Config:
        from_attributes = True