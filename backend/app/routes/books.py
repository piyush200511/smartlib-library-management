from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse
from app.database import get_db
from app.models.book import Book
from app.models.user import User
from app.models.notification import Notification
from app.schemas.book import BookCreate
from app.middleware.role_checker import librarian_or_admin, any_user

router = APIRouter(prefix="/api/books", tags=["Books"])


@router.post("/")
async def add_book(
    data: BookCreate,
    user: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Book).where(Book.isbn == data.isbn))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "ISBN already exists")

    book = Book(**data.dict(), available_copies=data.total_copies)
    db.add(book)
    await db.commit()
    await db.refresh(book)

    # Log the notification
    notif = Notification(
        title="New Book Added",
        message=f"'{book.title}' by {book.author} was added to the catalog.",
        type="success"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "Book added", "id": book.id}


@router.get("/")
async def list_books(
    search: Optional[str] = None,
    category: Optional[str] = None,
    available_only: bool = False,
    user: User = Depends(any_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Book)
    if search:
        query = query.where(or_(
            Book.title.ilike(f"%{search}%"),
            Book.author.ilike(f"%{search}%"),
            Book.isbn.ilike(f"%{search}%")
        ))
    if category:
        query = query.where(Book.category == category)
    if available_only:
        query = query.where(Book.available_copies > 0)

    result = await db.execute(query)
    books = result.scalars().all()
    return [
        {
            "id": b.id, "isbn": b.isbn, "title": b.title,
            "author": b.author, "category": b.category,
            "total_copies": b.total_copies,
            "available_copies": b.available_copies,
            "rack_no": b.rack_no
        }
        for b in books
    ]


@router.get("/{book_id}/qrcode")
async def get_book_qrcode(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(str(book.id))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@router.put("/{book_id}")
async def update_book(
    book_id: int,
    data: BookCreate,
    user: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")

    for k, v in data.dict().items():
        setattr(book, k, v)
    await db.commit()
    
    # Optional: Log the update
    notif = Notification(
        title="Book Updated",
        message=f"Details for '{book.title}' were updated.",
        type="info"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "Updated"}


@router.delete("/{book_id}")
async def delete_book(
    book_id: int,
    user: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")
        
    title = book.title
    await db.delete(book)
    await db.commit()
    
    # Log the deletion
    notif = Notification(
        title="Book Deleted",
        message=f"'{title}' was removed from the system.",
        type="warning"
    )
    db.add(notif)
    await db.commit()
    
    return {"msg": "Deleted"}