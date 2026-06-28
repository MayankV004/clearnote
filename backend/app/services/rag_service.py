import json
import httpx
import tempfile
from typing import List
import pdfplumber
from google import genai
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.logger import logger
from app.models.guideline_chunk import GuidelineChunk
from app.models.interaction import Interaction

class RAGService:
    def __init__(self):
        self._gemini_client = None
        self._groq_client = None

    @property
    def gemini_client(self):
        if self._gemini_client is None:
            self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._gemini_client

    @property
    def groq_client(self) -> AsyncGroq:
        if self._groq_client is None:
            self._groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._groq_client

    async def get_embedding(self, text: str) -> List[float]:
        try:
            response = self.gemini_client.models.embed_content(
                model="embedding-001",
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Failed to generate Gemini embedding: {e}")
            return [0.0] * 768

    async def ingest_guidelines(self, url: str, source_name: str, db: AsyncSession) -> int:
        logger.info(f"Ingesting guidelines from {url}...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                pdf_bytes = response.content

            with tempfile.NamedTemporaryFile(delete=True) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_file.flush()

                chunks = []
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1600,  # ~400 chars/tokens
                    chunk_overlap=200
                )

                with pdfplumber.open(tmp_file.name) as pdf:
                    for i, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if not text:
                            continue
                        text_chunks = splitter.split_text(text)
                        for chunk_text in text_chunks:
                            embedding = await self.get_embedding(chunk_text)
                            chunk_record = GuidelineChunk(
                                source=source_name,
                                page=i + 1,
                                content=chunk_text,
                                embedding=embedding
                            )
                            db.add(chunk_record)
                            chunks.append(chunk_record)

                await db.commit()
                logger.info(f"Successfully ingested {len(chunks)} guideline chunks.")
                return len(chunks)
        except Exception as e:
            logger.error(f"Failed to ingest guidelines: {e}")
            raise e

    async def check_drug_interactions(self, consultation_id: str, medications: list, diagnoses: list, db: AsyncSession) -> None:
        if len(medications) < 2:
            return

        diag_context = ", ".join([d.description for d in diagnoses]) if diagnoses else "No specific diagnosis"
        
        # Check pairs of medications
        for i in range(len(medications)):
            for j in range(i + 1, len(medications)):
                drug_a = medications[i].name
                drug_b = medications[j].name
                
                query_text = f"drug interaction between {drug_a} and {drug_b} in context of {diag_context}"
                query_embedding = await self.get_embedding(query_text)

                # Cosine similarity search using pgvector `<=>`
                stmt = select(GuidelineChunk).order_by(
                    GuidelineChunk.embedding.cosine_distance(query_embedding)
                ).limit(3)
                
                result = await db.execute(stmt)
                top_chunks = result.scalars().all()

                context_str = "\n\n".join([f"Source: {c.source} (Page {c.page}):\n{c.content}" for c in top_chunks])

                prompt = f"""You are a clinical pharmacology assistant. Based ONLY on the provided guideline context, assess the drug interaction.
Context:
{context_str}

Drug A: {drug_a}
Drug B: {drug_b}
Diagnosis Context: {diag_context}

Rules:
- If the context does not support a conclusion or no strong interaction exists, set severity to NONE.
- Return ONLY valid JSON matching the exact schema below.

Schema:
{{
  "severity": "NONE", // or MILD, MODERATE, SEVERE
  "mechanism": "string description",
  "recommendation": "string recommendation",
  "source_reference": "string e.g. WHO EML 2023, p.47",
  "confidence": 0.95
}}"""

                try:
                    response = await self.groq_client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        response_format={"type": "json_object"},
                        temperature=0.0,
                    )
                    content = response.choices[0].message.content
                    data = json.loads(content)
                    
                    interaction = Interaction(
                        consultation_id=consultation_id,
                        drug_a=drug_a,
                        drug_b=drug_b,
                        severity=data.get("severity", "NONE"),
                        guideline_ref=data.get("source_reference", "None"),
                        mechanism=data.get("mechanism", ""),
                        recommendation=data.get("recommendation", ""),
                        confidence=float(data.get("confidence", 0.0))
                    )
                    db.add(interaction)
                except Exception as e:
                    logger.error(f"Failed to check interaction for {drug_a} and {drug_b}: {e}")

        await db.commit()

rag_service = RAGService()
