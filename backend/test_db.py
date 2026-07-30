import asyncio
from app.db.session import AsyncSessionLocal
from app.models.doctor import Doctor
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Doctor))
        doctor = result.scalars().first()
        print(f"Doctor signature_url: {doctor.signature_url}")

asyncio.run(main())
