import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def wipe_db():
    print(f"Connecting to {settings.DATABASE_URL.split('@')[1]}...")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Dropping public schema...")
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        print("Recreating public schema...")
        await conn.execute(text("CREATE SCHEMA public;"))
        print("Database completely wiped!")
        
    await engine.dispose()

if __name__ == "__main__":
    from sqlalchemy import text
    asyncio.run(wipe_db())
