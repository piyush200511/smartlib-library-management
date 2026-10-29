from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    LIBRARIAN = "librarian"
    MEMBER = "member"


class UserStatus(str, Enum):
    ACTIVE = "active"
    BLOCKED = "blocked"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.MEMBER, nullable=False)
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user")