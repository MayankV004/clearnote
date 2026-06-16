import asyncio
from sqlalchemy import select
from fastapi import BackgroundTasks
from app.db.session import AsyncSessionLocal
from app.models.consultation import Consultation
from app.services.consultation_service import ConsultationService

async def test():
    async with AsyncSessionLocal() as db:
        consultation_id = "bae59e96-1703-41f3-ae1c-0a42bacf055b"
        consultation = await db.scalar(select(Consultation).where(Consultation.id == consultation_id))
        bg = BackgroundTasks()
        print("Running save_audio_and_transcribe...")
        try:
            await ConsultationService.save_audio_and_transcribe(db, consultation, b"fake audio", bg)
            print("Successfully enqueued!")
            print("Running background tasks...")
            await bg()
            print("Background tasks finished!")
        except Exception as e:
            print(f"Failed: {e}")

asyncio.run(test())
