import asyncio
from deepgram import AsyncDeepgramClient
from app.core.config import settings

async def test():
    try:
        deepgram = AsyncDeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
        payload = b"test"
        response = await deepgram.listen.v1.media.transcribe_file(
            request=payload, 
            model="nova-2-medical", 
            smart_format=True
        )
        print("Success:", response)
    except Exception as e:
        print("Failed:", e)

asyncio.run(test())
