from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    author = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    rack_no = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)