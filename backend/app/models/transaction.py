from sqlalchemy import Column, Integer, DateTime, Float, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class TransactionStatus(str, Enum):
    ISSUED = "issued"
    RETURNED = "returned"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)
    fine = Column(Float, default=0.0)
    fine_paid = Column(Boolean, default=False)  # <-- ADDED THIS
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.ISSUED)

    user = relationship("User", back_populates="transactions")
    book = relationship("Book")