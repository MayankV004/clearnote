import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logger import logger
from app.schemas.llm import SOAPExtractionResult
from app.prompts.soap_extraction import SOAP_EXTRACTION_PROMPT


class LLMService:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._client

    async def extract_structured_data(self, transcript: str) -> SOAPExtractionResult:
        # Format the ChatPromptTemplate into Groq-compatible message dicts
        messages = SOAP_EXTRACTION_PROMPT.format_messages(transcript=transcript)
        groq_messages = [{"role": m.type if m.type != "human" else "user", "content": m.content} for m in messages]

        logger.info("Calling Groq LLM for SOAP extraction...")

        try:
            response = await self.client.chat.completions.create(
                messages=groq_messages,
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=2048,
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Received empty content from Groq API")

            parsed_data = json.loads(content)
            result = SOAPExtractionResult(**parsed_data)
            logger.info("Successfully extracted structured SOAP data using Groq.")
            return result

        except Exception as e:
            logger.error(f"Failed to extract structured data from Groq: {e}")
            return SOAPExtractionResult(
                subjective="LLM Extraction failed. Please refer to raw transcript.",
                objective="",
                assessment="",
                plan="",
                medications=[],
                diagnoses=[],
                allergies=[],
                confidence=0.0,
            )


# Singleton instance
llm_service = LLMService()
