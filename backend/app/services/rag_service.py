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
from app.prompts.drug_interaction import DRUG_INTERACTION_PROMPT
from app.schemas.rag import InteractionResult

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

    async def ingest_from_bytes(self, pdf_bytes: bytes, source_name: str, db: AsyncSession) -> int:
        """
        Ingest a PDF from raw bytes (e.g. from a file upload).
        Chunks the text, generates embeddings, and stores in guideline_chunks table.
        """
        logger.info(f"Ingesting guidelines from uploaded file ({len(pdf_bytes):,} bytes), source='{source_name}'")
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name

            return await self._process_pdf(tmp_path, source_name, db)
        except Exception as e:
            logger.error(f"Failed to ingest guidelines from bytes: {e}")
            raise

    async def ingest_guidelines(self, url: str, source_name: str, db: AsyncSession) -> int:
        """Ingest a PDF from a remote URL."""
        logger.info(f"Ingesting guidelines from {url}...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                pdf_bytes = response.content

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name

            return await self._process_pdf(tmp_path, source_name, db)
        except Exception as e:
            logger.error(f"Failed to ingest guidelines: {e}")
            raise

    async def _process_pdf(self, tmp_path: str, source_name: str, db: AsyncSession) -> int:
        """Shared PDF processing logic: extract text → chunk → embed → store."""
        import os
        try:
            chunks = []
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1600,
                chunk_overlap=200,
            )

            with pdfplumber.open(tmp_path) as pdf:
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
                            embedding=embedding,
                        )
                        db.add(chunk_record)
                        chunks.append(chunk_record)

            await db.commit()
            logger.info(f"Successfully ingested {len(chunks)} guideline chunks from '{source_name}'.")
            return len(chunks)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)



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

                context_str = "\n\n".join(
                    [f"Source: {c.source} (Page {c.page}):\n{c.content}" for c in top_chunks]
                )

                # Build messages from ChatPromptTemplate
                messages = DRUG_INTERACTION_PROMPT.format_messages(
                    drug_a=drug_a,
                    drug_b=drug_b,
                    diag_context=diag_context,
                    context_str=context_str,
                )
                groq_messages = [
                    {"role": m.type if m.type != "human" else "user", "content": m.content}
                    for m in messages
                ]

                try:
                    response = await self.groq_client.chat.completions.create(
                        messages=groq_messages,
                        model="llama-3.3-70b-versatile",
                        response_format={"type": "json_object"},
                        temperature=0.0,
                    )
                    content = response.choices[0].message.content

                    # Validated Pydantic output — enforces severity enum + confidence range
                    interaction_result = InteractionResult.model_validate_json(content)

                    interaction = Interaction(
                        consultation_id=consultation_id,
                        drug_a=drug_a,
                        drug_b=drug_b,
                        severity=interaction_result.severity,
                        guideline_ref=interaction_result.source_reference,
                        mechanism=interaction_result.mechanism,
                        recommendation=interaction_result.recommendation,
                        confidence=interaction_result.confidence,
                    )
                    db.add(interaction)
                except Exception as e:
                    logger.error(f"Failed to check interaction for {drug_a} and {drug_b}: {e}")

        await db.commit()

rag_service = RAGService()
