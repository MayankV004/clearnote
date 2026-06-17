from typing import List, Optional
from pydantic import BaseModel, Field

class MedicationSchema(BaseModel):
    name: str = Field(..., description="Name of the medication")
    dosage: str = Field(..., description="Dosage of the medication, e.g., 500mg. Empty string if not mentioned.")
    frequency: str = Field(..., description="Frequency of intake, e.g., twice a day. Empty string if not mentioned.")
    duration: str = Field(..., description="Duration for which to take the medication, e.g., 7 days. Empty string if not mentioned.")
    route: str = Field(..., description="Route of administration, e.g., oral. Empty string if not mentioned.")

class DiagnosisSchema(BaseModel):
    icd_code: str = Field(..., description="The estimated ICD-10 code for the diagnosis. Empty string if unsure.")
    description: str = Field(..., description="Description of the diagnosis.")

class SOAPExtractionResult(BaseModel):
    subjective: str = Field(..., description="Subjective section of the SOAP note.")
    objective: str = Field(..., description="Objective section of the SOAP note.")
    assessment: str = Field(..., description="Assessment section of the SOAP note.")
    plan: str = Field(..., description="Plan section of the SOAP note.")
    medications: List[MedicationSchema] = Field(default_factory=list, description="List of medications prescribed or mentioned.")
    diagnoses: List[DiagnosisSchema] = Field(default_factory=list, description="List of diagnoses established.")
    allergies: List[str] = Field(default_factory=list, description="List of patient allergies mentioned.")
    confidence: float = Field(..., description="A confidence score between 0.0 and 1.0 regarding the accuracy of the extraction.")
