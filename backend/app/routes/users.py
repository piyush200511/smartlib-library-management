from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.notification import Notification
from app.schemas.user import RegisterSchema
from app.utils.security import hash_password
from app.middleware.role_checker import admin_only, any_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/")
async def list_users(
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value,
            "status": u.status.value,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.get("/me")
async def get_me(user: User = Depends(any_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value,
        "status": user.status.value
    }


@router.post("/create")
async def create_user_with_role(
    data: RegisterSchema,
    role: UserRole,
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    # 🔒 SECURITY: Prevent creating another Admin
    if role == UserRole.ADMIN:
        raise HTTPException(400, "Cannot create another Admin. Only one Admin is allowed.")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        phone=data.phone,
        role=role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    notif = Notification(
        title="New User Created",
        message=f"Admin created a new {role.value} account for {user.name}.",
        type="success"
    )
    db.add(notif)
    await db.commit()

    return {"msg": f"{role.value} created", "id": user.id}


@router.put("/{user_id}/role")
async def change_role(
    user_id: int,
    role: UserRole,
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
        
    # 🔒 SECURITY: Prevent modifying the Admin
    if user.role == UserRole.ADMIN:
        raise HTTPException(400, "Cannot change the role of an Admin.")
        
    # 🔒 SECURITY: Prevent promoting anyone else to Admin
    if role == UserRole.ADMIN:
        raise HTTPException(400, "Cannot promote users to Admin. Only one Admin is allowed.")

    # 🔒 LIMIT: Max 3 Librarians
    if role == UserRole.LIBRARIAN and user.role != UserRole.LIBRARIAN:
        librarian_r = await db.execute(select(User).where(User.role == UserRole.LIBRARIAN))
        if len(librarian_r.scalars().all()) >= 3:
            raise HTTPException(400, "Limit reached. There can only be 3 Librarians.")

    user.role = role
    await db.commit()

    notif = Notification(
        title="User Role Updated",
        message=f"Admin changed {user.name}'s role to {role.value}.",
        type="info"
    )
    db.add(notif)
    await db.commit()

    return {"msg": f"Role updated to {role.value}"}


@router.put("/{user_id}/block")
async def block_user(
    user_id: int,
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
        
    # 🔒 SECURITY: Prevent blocking the Admin
    if user.role == UserRole.ADMIN or user.id == admin.id:
        raise HTTPException(400, "Cannot block the Admin.")

    user.status = UserStatus.BLOCKED
    await db.commit()

    notif = Notification(
        title="User Blocked",
        message=f"{user.name} was blocked from accessing the system.",
        type="warning"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "User blocked"}


@router.put("/{user_id}/unblock")
async def unblock_user(
    user_id: int,
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.status = UserStatus.ACTIVE
    await db.commit()

    notif = Notification(
        title="User Unblocked",
        message=f"{user.name} was unblocked and can access the system again.",
        type="success"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "User unblocked"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
        
    # 🔒 SECURITY: Prevent deleting the Admin
    if user.role == UserRole.ADMIN or user.id == admin.id:
        raise HTTPException(400, "Cannot delete the Admin.")

    name = user.name
    await db.delete(user)
    await db.commit()

    notif = Notification(
        title="User Deleted",
        message=f"User {name} was removed from the system.",
        type="warning"
    )
    db.add(notif)
    await db.commit()

    return {"msg": "User deleted"}