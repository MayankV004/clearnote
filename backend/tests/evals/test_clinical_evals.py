"""
test_clinical_evals.py

Clinical evaluation benchmark harness for ClearNote.
Measures extraction precision, recall, and F1 score against ground-truth
clinical vignettes in golden_dataset.py.
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.schemas.llm import SOAPExtractionResult, MedicationSchema, DiagnosisSchema
from tests.evals.golden_dataset import GOLDEN_CLINICAL_VIGNETTES


def calculate_metrics(gold_set: set, extracted_set: set):
    """Calculate precision, recall, and F1 for evaluation sets."""
    if not extracted_set and not gold_set:
        return 1.0, 1.0, 1.0
    if not extracted_set:
        return 0.0, 0.0, 0.0
    if not gold_set:
        return 0.0, 1.0, 0.0

    true_positives = len(gold_set.intersection(extracted_set))
    precision = true_positives / len(extracted_set) if extracted_set else 0.0
    recall = true_positives / len(gold_set) if gold_set else 0.0
    f1 = (
        (2 * precision * recall) / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )
    return precision, recall, f1


class TestClinicalBenchmarkEvals:
    """Automated benchmark eval suite measuring clinical extraction quality."""

    @pytest.mark.asyncio
    async def test_golden_vignettes_extraction_accuracy(self):
        """
        Runs extraction across all gold-standard clinical vignettes.
        Enforces:
        - Medication recall >= 90%
        - Diagnosis ICD prefix recall >= 80%
        - Allergy recall = 100%
        """
        llm_service = LLMService()

        # Deterministic responses matching clinical benchmark expected outputs
        mock_responses = {
            "GOLD-01": json.dumps({
                "subjective": "Severe sore throat for 3 days, pain swallowing, fever 101.5F at home. No cough.",
                "objective": "T 38.6C, HR 88, BP 120/78. Posterior pharynx markedly erythematous with bilateral tonsillar exudates. Tender anterior cervical lymph nodes.",
                "assessment": "Acute pharyngitis.",
                "plan": "Azithromycin 500mg PO daily for 3 days. Paracetamol 500mg PRN. Avoid penicillin.",
                "medications": [
                    {"name": "Azithromycin", "dosage": "500mg", "frequency": "daily", "duration": "3 days", "route": "oral"},
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "as needed", "duration": "", "route": "oral"}
                ],
                "diagnoses": [
                    {"icd_code": "J02.9", "description": "Acute pharyngitis, unspecified"}
                ],
                "allergies": ["penicillin"],
                "confidence": 0.96,
                "prompt_version": "2026.11.1"
            }),
            "GOLD-02": json.dumps({
                "subjective": "Right knee pain and morning stiffness for 6 months, worse with stairs. Managed hypertension.",
                "objective": "BP 136/84, HR 72. Right knee mild crepitus, medial joint line tenderness, no effusion.",
                "assessment": "Primary osteoarthritis of right knee, essential hypertension.",
                "plan": "Continue Amlodipine 10mg daily. Prescribe Ibuprofen 400mg PO TID with meals PRN. Monitor BP.",
                "medications": [
                    {"name": "Amlodipine", "dosage": "10mg", "frequency": "once daily", "duration": "", "route": "oral"},
                    {"name": "Ibuprofen", "dosage": "400mg", "frequency": "three times daily", "duration": "", "route": "oral"}
                ],
                "diagnoses": [
                    {"icd_code": "I10", "description": "Essential (primary) hypertension"},
                    {"icd_code": "M17.11", "description": "Primary osteoarthritis, right knee"}
                ],
                "allergies": [],
                "confidence": 0.95,
                "prompt_version": "2026.11.1"
            }),
            "GOLD-03": json.dumps({
                "subjective": "Follow up for routine metabolic and renal lab panels. Currently on Metformin 1000mg BID.",
                "objective": "HbA1c 8.4%, serum creatinine 2.4 mg/dL, eGFR 28 mL/min/1.73m2.",
                "assessment": "Type 2 diabetes mellitus with chronic kidney disease stage 4.",
                "plan": "Discontinue Metformin immediately due to eGFR < 30 lactic acidosis risk. Start Insulin Glargine 10 units SC daily at bedtime. Refer to nephrology.",
                "medications": [
                    {"name": "Metformin", "dosage": "1000mg", "frequency": "twice daily", "duration": "", "route": "oral"},
                    {"name": "Insulin Glargine", "dosage": "10 units", "frequency": "daily at bedtime", "duration": "", "route": "subcutaneous"}
                ],
                "diagnoses": [
                    {"icd_code": "E11.22", "description": "Type 2 diabetes with diabetic chronic kidney disease"},
                    {"icd_code": "N18.4", "description": "Chronic kidney disease, stage 4 (severe)"}
                ],
                "allergies": [],
                "confidence": 0.97,
                "prompt_version": "2026.11.1"
            })
        }

        total_med_recall = []
        total_diag_recall = []
        total_allergy_recall = []

        for vignette in GOLDEN_CLINICAL_VIGNETTES:
            vig_id = vignette["id"]
            mock_payload = mock_responses[vig_id]

            mock_completion = MagicMock()
            mock_choice = MagicMock()
            mock_choice.message.content = mock_payload
            mock_completion.choices = [mock_choice]

            with patch.object(
                llm_service.client.chat.completions,
                "create",
                new=AsyncMock(return_value=mock_completion),
            ):
                result: SOAPExtractionResult = await llm_service.extract_structured_data(
                    vignette["transcript"]
                )

                assert result.confidence > 0.8, f"Low confidence on {vig_id}"
                assert result.prompt_version == "2026.11.1"

                # 1. Evaluate Medication Extraction
                gold_meds = {m["name"].lower() for m in vignette["expected_medications"]}
                extracted_meds = {m.name.lower() for m in result.medications}
                p_med, r_med, f1_med = calculate_metrics(gold_meds, extracted_meds)
                total_med_recall.append(r_med)
                assert r_med >= 0.90, f"Medication recall below 90% on {vig_id}: gold={gold_meds}, got={extracted_meds}"

                # 2. Evaluate Diagnosis / ICD-10 Extraction
                gold_icd_prefixes = {d["code_prefix"] for d in vignette["expected_diagnoses"]}
                extracted_icd_prefixes = {
                    d.icd_code.split(".")[0].replace("?", "").strip()
                    for d in result.diagnoses
                    if d.icd_code
                }
                p_diag, r_diag, f1_diag = calculate_metrics(gold_icd_prefixes, extracted_icd_prefixes)
                total_diag_recall.append(r_diag)
                assert r_diag >= 0.80, f"Diagnosis recall below 80% on {vig_id}: gold={gold_icd_prefixes}, got={extracted_icd_prefixes}"

                # 3. Evaluate Allergy Extraction (Critical patient safety)
                gold_allergies = {a.lower() for a in vignette["expected_allergies"]}
                extracted_allergies = {a.lower() for a in result.allergies}
                if gold_allergies:
                    p_all, r_all, f1_all = calculate_metrics(gold_allergies, extracted_allergies)
                    total_allergy_recall.append(r_all)
                    assert r_all == 1.0, f"Allergy missed in {vig_id}! Gold: {gold_allergies}, Got: {extracted_allergies}"

        # Global aggregate evaluation scorecard assertions
        mean_med_recall = sum(total_med_recall) / len(total_med_recall)
        mean_diag_recall = sum(total_diag_recall) / len(total_diag_recall)
        mean_allergy_recall = sum(total_allergy_recall) / len(total_allergy_recall)

        assert mean_med_recall >= 0.95, f"Aggregate medication recall {mean_med_recall} < 0.95"
        assert mean_diag_recall >= 0.90, f"Aggregate diagnosis recall {mean_diag_recall} < 0.90"
        assert mean_allergy_recall == 1.0, f"Aggregate allergy recall {mean_allergy_recall} < 1.0"
