import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.llm_service import llm_service

async def main():
    transcript = "mild fever and headache .Paracematol 500 for the next 2 days"
    try:
        res = await llm_service.extract_structured_data(transcript)
        print("Success:")
        print(res)
    except Exception as e:
        print("Failed!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
