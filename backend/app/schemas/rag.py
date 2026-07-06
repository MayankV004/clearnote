"""
rag.py

Pydantic output schema for the RAG drug interaction LLM response.
Using model_validate_json() instead of manual dict.get() gives us
enum enforcement, type coercion, and descriptive validation errors.
"""
from typing import Literal
from pydantic import BaseModel, Field


class InteractionResult(BaseModel):
    severity: Literal["NONE", "MILD", "MODERATE", "SEVERE"] = Field(
        ...,
        description="Clinical severity of the drug interaction.",
    )
    mechanism: str = Field(
        default="",
        description="Pharmacological explanation of the interaction.",
    )
    recommendation: str = Field(
        default="",
        description="Clinical action recommended for this interaction.",
    )
    source_reference: str = Field(
        default="",
        description="Guideline source and page number supporting the assessment.",
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score (0–1) for how well context supports the conclusion.",
    )
