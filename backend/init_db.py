import asyncio
from app.database import Base, engine
from app import models  # noqa: F401  <- registers all models


async def init():
    print("🔧 Creating tables on Neon...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created (or already exist)")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())