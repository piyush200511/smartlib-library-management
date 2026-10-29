from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.book import Book
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.utils.security import hash_password
from app.middleware.role_checker import librarian_or_admin, admin_only
import pandas as pd
import io

router = APIRouter(prefix="/api/import", tags=["CSV Import"])


@router.post("/books")
async def import_books(
    file: UploadFile = File(...),
    user: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only .csv files allowed")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Invalid CSV: {e}")

    required = {"isbn", "title", "author", "category"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"Missing columns. Required: {required}")

    inserted, skipped, errors = 0, 0, []

    for idx, row in df.iterrows():
        try:
            isbn = str(row["isbn"]).strip()
            existing = await db.execute(select(Book).where(Book.isbn == isbn))
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            total = int(row.get("total_copies", 1)) if pd.notna(row.get("total_copies", 1)) else 1
            rack = str(row.get("rack_no", "")).strip() if pd.notna(row.get("rack_no")) else None

            book = Book(
                isbn=isbn,
                title=str(row["title"]).strip(),
                author=str(row["author"]).strip(),
                category=str(row["category"]).strip(),
                total_copies=total,
                available_copies=total,
                rack_no=rack or None
            )
            db.add(book)
            await db.flush()
            inserted += 1
        except Exception as e:
            errors.append({"row": idx + 2, "error": str(e)})

    # 👇 LOG THE BULK IMPORT
    print(f"DEBUG: Imported {inserted} books, Skipped {skipped} books.") # <-- Check your backend terminal!
    
    if inserted > 0:
        notif = Notification(
            title="Bulk Books Imported",
            message=f"{user.name} imported {inserted} new books into the catalog.",
            type="success"
        )
        db.add(notif)
        print("DEBUG: Success Notification Created")
    elif inserted == 0 and skipped > 0:
        notif = Notification(
            title="Import Warning",
            message=f"{user.name} tried to import a CSV, but all {skipped} books were duplicates.",
            type="warning"
        )
        db.add(notif)
        print("DEBUG: Warning Notification Created")

    await db.commit()
    return {
        "msg": "Books import completed",
        "inserted": inserted,
        "skipped_duplicates": skipped,
        "errors": errors
    }