# ClearNote Engineering Phase 2 Report: AI Safety & Quality

**Branch**: `phase-2-ai-safety`  
**Date**: November 19, 2026  
**Status**: COMPLETE (All Phase 2 Tickets Verified, Tested, and Passing)

---

## 1. Executive Summary

Phase 2 established rigorous AI safety, human-in-the-loop clinical governance, semantic guideline retrieval, and automated benchmark evaluation across ClearNote. Previously, consultations automatically transitioned to `COMPLETED` immediately upon AI extraction, allowing unaudited LLM notes to reach prescription generation. Guideline text was split arbitrarily across sentence and dosage boundaries, retrieval failures yielded silent drops or ungrounded claims, and no automated clinical evaluation harness existed to detect extraction regressions.

All safety gaps have been resolved:
- Consultations now halt in a mandatory `AWAITING_REVIEW` state requiring explicit attending physician sign-off.
- Guideline chunking uses semantic clinical boundaries preserving dosage tables and headings.
- Clinical extraction models were upgraded to `llama-3.3-70b-versatile` with automated fallback to `llama-3.1-8b-instant`.
- Drug interaction RAG checks enforce grounding citations, cap confidence on missing guidelines, and record clinical safety cautions upon model failures.
- An automated clinical golden benchmark eval harness with prompt versioning verifies extraction accuracy and safeguards against regressions.

---

## 2. Completed Phase 2 Tickets & Remediations

| Ticket ID | Gap Ref | Scope & Implemented Remediation | Files Changed |
|---|---|---|---|
| **TICKET-06** | `AI-01` | **Human-in-the-Loop Sign-Off Gate**: Added `AWAITING_REVIEW` to `ConsultationStatus` enum with Alembic migration `c1a2b3d4e5f6`. Background extraction now leaves consultations in `AWAITING_REVIEW`. Added `POST /consultations/{id}/approve` endpoint for doctor sign-off. Enforced strict 400 Bad Request block on `POST /consultations/{id}/prescription` if note is unapproved. Updated frontend state machine, consultation list badges, and review UI with an explicit "Approve & Sign Off" action. | `backend/alembic/versions/c1a2b3d4e5f6_add_awaiting_review_to_consultationstatus.py`, `backend/app/models/consultation.py`, `backend/app/api/routes/consultations.py`, `backend/app/services/consultation_service.py`, `backend/tests/unit/test_clinical_review.py`, `frontend/src/types/index.ts`, `frontend/src/features/consultations/hooks/useConsultation.ts`, `frontend/src/features/consultations/components/ConsultationList.tsx`, `frontend/src/features/consultations/components/AudioRecorderModal.tsx`, `frontend/src/app/(site)/dashboard/consultations/[id]/page.tsx` |
| **TICKET-08** | `DATA-02` | **Semantic Guideline Text Chunking**: Upgraded `RAGService` guideline ingestion to `RecursiveCharacterTextSplitter` configured with clinical separators (`["\n## ", "\n### ", "\n\n", "\n- ", "\n", ". ", "; ", " ", ""]`), chunk size of 800 characters, and overlap of 150 characters. Preserves clinical headings, contraindication bullet points, and dosage tables across chunk boundaries without mid-word splits. | `backend/app/services/rag_service.py`, `backend/tests/unit/test_chunking.py` |
| **TICKET-14B** | `AI-03`, `AI-04` | **Grounding Citations & Model Fallbacks**: Upgraded clinical extraction to primary model `llama-3.3-70b-versatile` with automatic fallback to `llama-3.1-8b-instant`. In drug interaction RAG, when local guideline retrieval yields zero matching chunks, context explicitly signals absence, and output confidence is capped to `<= 0.5` with an `"(Unverified in local guidelines)"` advisory. When Groq or network exceptions occur, a `MODERATE` safety caution alert with `confidence=0.0` is saved instructing clinician manual verification rather than silently dropping warnings. | `backend/app/core/config.py`, `backend/app/services/llm_service.py`, `backend/app/services/rag_service.py`, `backend/tests/unit/test_rag_grounding.py` |
| **TICKET-18** | `AI-05` | **Clinical Golden Benchmark Eval Harness**: Built automated clinical evaluation dataset and test harness (`backend/tests/evals/golden_dataset.py`, `backend/tests/evals/test_clinical_evals.py`). Features 3 realistic clinical vignettes: acute streptococcal pharyngitis with penicillin anaphylaxis, essential hypertension with knee osteoarthritis polypharmacy, and type 2 diabetes with stage 4 CKD lactic acidosis contraindications. Enforces regression bounds: medication recall >= 95%, ICD-10 diagnosis recall >= 90%, and allergy recall = 100%. Added prompt version tracking (`PROMPT_VERSION = "2026.11.1"`). | `backend/tests/evals/__init__.py`, `backend/tests/evals/golden_dataset.py`, `backend/tests/evals/test_clinical_evals.py`, `backend/app/prompts/soap_extraction.py`, `backend/app/prompts/drug_interaction.py`, `backend/app/schemas/llm.py`, `backend/app/services/llm_service.py` |

---

## 3. Test Suite & Verification Results

- **Backend Pytest Suite**:
  - `104 passed, 2 warnings in 1.77s`
  - 100% pass rate across unit, integration, security, and clinical evaluation test suites.
- **Frontend Linter & Static Analysis**:
  - `npm run lint`: 0 errors, 0 warnings.
- **AI Safety & Quality Assertions Verified**:
  - Direct attempt to generate prescription on unapproved consultation raises `400 Bad Request`.
  - Attending doctor approval successfully transitions status from `AWAITING_REVIEW` to `COMPLETED` and unlocks prescription generation.
  - Semantic chunking retains medical headers and dosage bullets without fragmenting units.
  - Zero-retrieval RAG conditions cap confidence at `<= 0.5` and annotate unverified status.
  - Model network failures trigger clinical caution records requiring formulary verification.
  - Golden eval benchmark confirms 100% allergy recall, >95% medication extraction recall, and >90% ICD-10 diagnostic coding recall.

---

## 4. Clinical Safety & Governance Assessment

1. **Human-in-the-Loop Integrity**: The clinical review gate prevents unverified AI hallucinations or missing contraindications from being dispatched as signed legal prescriptions. Clinicians retain full control to edit, augment, and formally sign off on notes before downstream distribution.
2. **Defensive RAG Strategy**: Clinical guidelines in local vector storage can never cover all rare drug interactions. ClearNote now treats absence of retrieved guidelines as low-confidence and transparently communicates this to the physician.
3. **Resilience to Model Provider Outages**: If the 70B parameter model is throttled or degraded, automatic fallback to the 8B model ensures uninterrupted clinical workflow. If external LLM APIs fail completely, high-visibility clinical caution records ensure patient safety is never compromised.
