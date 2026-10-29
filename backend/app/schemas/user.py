from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True