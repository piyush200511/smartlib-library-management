from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import RegisterSchema, LoginSchema
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(data: RegisterSchema, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # 🔒 SECURITY: Public registration is HARDCODED to Member
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        phone=data.phone,
        role=UserRole.MEMBER  # <-- Always Member
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"msg": "Registered successfully", "user_id": user.id}


@router.post("/login")
async def login(data: LoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(401, "Invalid credentials")
    if user.status == "blocked":
        raise HTTPException(403, "Account blocked")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "name": user.name
    }