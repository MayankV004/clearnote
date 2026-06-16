import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT id, status, processing_error FROM consultations ORDER BY created_at DESC LIMIT 3"))
        for row in result:
            print(row)

asyncio.run(check_db())
