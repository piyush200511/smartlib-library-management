from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from app.database import get_db
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.book import Book
from app.middleware.role_checker import any_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/")
async def get_alerts(user=Depends(any_user), db: AsyncSession = Depends(get_db)):
    try:
        # 1. AUTOMATED OVERDUE CHECK
        overdue_r = await db.execute(
            select(Transaction)
            .where(
                Transaction.status == "ISSUED",
                Transaction.due_date < datetime.utcnow()
            )
        )
        overdue_txns = overdue_r.scalars().all()

        for txn in overdue_txns:
            book_r = await db.execute(select(Book).where(Book.id == txn.book_id))
            book = book_r.scalar_one_or_none()
            book_title = book.title if book else "Unknown Book"
            
            msg = f"Book ID #{txn.id} ('{book_title}') is past its due date!"
            
            existing_r = await db.execute(select(Notification).where(Notification.message == msg))
            if not existing_r.scalar_one_or_none():
                notif = Notification(title="Overdue Alert", message=msg, type="warning")
                db.add(notif)

        # 2. AUTOMATED OUT OF STOCK CHECK
        out_of_stock_r = await db.execute(select(Book).where(Book.available_copies == 0))
        out_of_stock_books = out_of_stock_r.scalars().all()

        for book in out_of_stock_books:
            msg = f"'{book.title}' is currently out of stock!"
            existing_r = await db.execute(select(Notification).where(Notification.message == msg))
            if not existing_r.scalar_one_or_none():
                notif = Notification(title="Out of Stock", message=msg, type="warning")
                db.add(notif)

        await db.commit()

        # 3. FETCH ONLY WARNINGS FOR THE BELL
        result = await db.execute(
            select(Notification)
            .where(Notification.type == "warning") 
            .order_by(Notification.created_at.desc())
            .limit(20)
        )
        notifs = result.scalars().all()
        
        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ]
        
    except Exception as e:
        print(f"Error in notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 👇 THIS IS THE FIXED ENDPOINT 👇
@router.get("/activity")
async def get_activity_log(user=Depends(any_user), db: AsyncSession = Depends(get_db)):
    try:
        # FETCH ONLY HISTORY (Ignore Warnings!)
        result = await db.execute(
            select(Notification)
            .where(Notification.type != "warning") 
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
        notifs = result.scalars().all()
        
        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": True,
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ]
    except Exception as e:
        print(f"Error in activity log: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/read-all")
async def mark_all_read(user=Depends(any_user), db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(update(Notification).where(Notification.type == "warning").values(is_read=True))
        await db.commit()
        return {"msg": "All alerts marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))