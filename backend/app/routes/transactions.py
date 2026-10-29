from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.database import get_db
from app.models.book import Book
from app.models.user import User
from app.models.transaction import Transaction, TransactionStatus
from app.models.notification import Notification
from app.middleware.role_checker import librarian_or_admin, any_user
from app.config import settings

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post("/issue/{book_id}/{user_id}")
async def issue_book(
    book_id: int,
    user_id: int,
    staff: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    book_r = await db.execute(select(Book).where(Book.id == book_id))
    book = book_r.scalar_one_or_none()
    if not book:
        raise HTTPException(404, "Book not found")
    if book.available_copies < 1:
        raise HTTPException(400, "No copies available")

    user_r = await db.execute(select(User).where(User.id == user_id))
    target_user = user_r.scalar_one_or_none()
    if not target_user:
        raise HTTPException(404, "User not found")

    active_r = await db.execute(select(Transaction).where(and_(
        Transaction.book_id == book_id,
        Transaction.user_id == user_id,
        Transaction.status == TransactionStatus.ISSUED
    )))
    if active_r.scalar_one_or_none():
        raise HTTPException(400, "User already has this book")

    issue_date = datetime.utcnow()
    txn = Transaction(
        user_id=user_id,
        book_id=book_id,
        issue_date=issue_date,
        due_date=issue_date + timedelta(days=14)
    )
    db.add(txn)
    book.available_copies -= 1
    await db.commit()
    await db.refresh(txn)

    # Log Notification
    notif = Notification(
        title="Book Issued",
        message=f"{target_user.name} borrowed '{book.title}'.",
        type="info"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "Issued", "txn_id": txn.id, "due_date": txn.due_date.isoformat()}


@router.post("/return/{txn_id}")
async def return_book(
    txn_id: int,
    staff: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn or txn.status == TransactionStatus.RETURNED:
        raise HTTPException(404, "Active transaction not found")

    today_date = datetime.utcnow().date()
    due_date = txn.due_date.date()

    fine = 0.0
    if today_date > due_date:
        days_late = (today_date - due_date).days
        fine = float(days_late) * 5.0 

    txn.return_date = datetime.utcnow()
    txn.fine = fine
    txn.status = TransactionStatus.RETURNED

    book_r = await db.execute(select(Book).where(Book.id == txn.book_id))
    book = book_r.scalar_one_or_none()
    book_title = book.title if book else "Unknown Book"
    if book:
        book.available_copies += 1

    await db.commit()

    # Log Notification
    msg = f"'{book_title}' returned. Fine: ₹{fine}" if fine > 0 else f"'{book_title}' returned on time."
    notif = Notification(
        title="Book Returned",
        message=msg,
        type="warning" if fine > 0 else "success"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "Returned", "fine": fine}


@router.put("/pay-fine/{txn_id}")
async def pay_fine(
    txn_id: int,
    staff: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    
    if not txn or txn.status != TransactionStatus.RETURNED:
        raise HTTPException(400, "Transaction not found or book not yet returned")
    
    if txn.fine <= 0:
        raise HTTPException(400, "No fine to pay for this transaction")

    txn.fine_paid = True
    await db.commit()

    # Log Notification
    notif = Notification(
        title="Fine Paid",
        message=f"Fine of ₹{txn.fine} for Transaction #{txn.id} has been cleared.",
        type="success"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "Fine paid successfully"}


@router.get("/my-history")
async def my_history(
    user: User = Depends(any_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.book))
        .where(Transaction.user_id == user.id)
    )
    txns = result.scalars().all()
    return [
        {
            "id": t.id,
            "book_id": t.book_id,
            "book_title": t.book.title if t.book else "Unknown",
            "user_id": t.user_id,
            "user_name": user.name,
            "issue_date": t.issue_date.isoformat(),
            "due_date": t.due_date.isoformat(),
            "return_date": t.return_date.isoformat() if t.return_date else None,
            "fine": t.fine,
            "fine_paid": t.fine_paid, # <-- ADDED
            "status": t.status.value
        }
        for t in txns
    ]


@router.get("/all")
async def all_transactions(
    staff: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.book), selectinload(Transaction.user))
    )
    txns = result.scalars().all()
    return [
        {
            "id": t.id,
            "book_id": t.book_id,
            "book_title": t.book.title if t.book else "Unknown",
            "user_id": t.user_id,
            "user_name": t.user.name if t.user else "Unknown",
            "issue_date": t.issue_date.isoformat(),
            "due_date": t.due_date.isoformat(),
            "return_date": t.return_date.isoformat() if t.return_date else None,
            "fine": t.fine,
            "fine_paid": t.fine_paid, # <-- ADDED
            "status": t.status.value
        }
        for t in txns
    ]


@router.get("/recent")
async def recent_activity(
    staff: User = Depends(librarian_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.book), selectinload(Transaction.user))
        .order_by(Transaction.issue_date.desc())
        .limit(5)
    )
    txns = result.scalars().all()
    return [
        {
            "id": t.id,
            "user_name": t.user.name if t.user else "Unknown",
            "book_title": t.book.title if t.book else "Unknown",
            "issue_date": t.issue_date.isoformat(),
            "due_date": t.due_date.isoformat(),
            "status": t.status.value
        }
        for t in txns
    ]


@router.get("/recommendations")
async def get_recommendations(
    user: User = Depends(any_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).options(selectinload(Transaction.book)).where(Transaction.user_id == user.id)
    )
    txns = result.scalars().all()
    
    borrowed_categories = set()
    borrowed_book_ids = set()
    for txn in txns:
        if txn.book:
            borrowed_categories.add(txn.book.category)
            borrowed_book_ids.add(txn.book_id)

    if not borrowed_categories:
        random_books_r = await db.execute(select(Book).where(Book.available_copies > 0).limit(4))
        return random_books_r.scalars().all()

    category_list = list(borrowed_categories)
    rec_query = select(Book).where(
        Book.category.in_(category_list),
        Book.id.notin_(borrowed_book_ids),
        Book.available_copies > 0
    ).limit(4)
    
    rec_books_r = await db.execute(rec_query)
    recs = rec_books_r.scalars().all()
    
    if not recs:
        fallback_r = await db.execute(
            select(Book).where(Book.id.notin_(borrowed_book_ids), Book.available_copies > 0).limit(4)
        )
        recs = fallback_r.scalars().all()

    return recs