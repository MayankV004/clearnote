import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logger import logger
from app.schemas.llm import SOAPExtractionResult

class LLMService:
    def __init__(self):
        # We initialize the client inside methods or lazily to ensure settings are loaded
        # But doing it here is fine as long as config is imported first.
        self._client = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._client

    async def extract_structured_data(self, transcript: str) -> SOAPExtractionResult:
        system_prompt = """You are a clinical documentation assistant. Given a doctor-patient consultation transcript, extract a structured SOAP note and medication list.
Rules:
- Only use information explicitly stated in the transcript.
- Do not infer diagnoses not mentioned by the doctor.
- If a field has no information, return an empty string.
- Return ONLY valid JSON matching the exact schema structure requested.

JSON Schema structure to match:
{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "route": "string"
    }
  ],
  "diagnoses": [
    {
      "icd_code": "string",
      "description": "string"
    }
  ],
  "allergies": ["string"],
  "confidence": 0.95
}"""
        
        logger.info("Calling Groq LLM for SOAP extraction...")
        
        try:
            response = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Transcript:\n{transcript}"}
                ],
                model="llama3-70b-8192",
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=2048,
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Received empty content from Groq API")
                
            parsed_data = json.loads(content)
            
            # Use Pydantic to validate and construct the object
            result = SOAPExtractionResult(**parsed_data)
            logger.info("Successfully extracted structured SOAP data using Groq.")
            return result
            
        except Exception as e:
            logger.error(f"Failed to extract structured data from Groq: {e}")
            # Fallback to an empty result so the pipeline doesn't completely crash
            return SOAPExtractionResult(
                subjective="LLM Extraction failed. Please refer to raw transcript.",
                objective="",
                assessment="",
                plan="",
                medications=[],
                diagnoses=[],
                allergies=[],
                confidence=0.0
            )

# Create a singleton instance
llm_service = LLMService()
