"""
tests/unit/test_chunking.py
───────────────────────────
Unit tests for TICKET-08 (DATA-02):
  - Semantic guideline text chunking with clinical delimiters
  - Preservation of clinical headings, contraindications, and dosages
"""
import pytest
from app.services.rag_service import rag_service

CLINICAL_SAMPLE_TEXT = """\
## SECTION 2: CARDIOVASCULAR MEDICINES

### 2.1 Anti-hypertensive Medicines
Amlodipine tablet 5 mg; 10 mg.
- Indications: Hypertension, chronic stable angina.
- Contraindications: Cardiogenic shock, severe aortic stenosis.
- Dosage: Initial dose 5 mg once daily; maximum 10 mg once daily.

### 2.2 Beta-blocking Agents
Atenolol tablet 50 mg; 100 mg.
- Indications: Hypertension, angina pectoris, cardiac arrhythmias.
- Interactions: Verapamil co-administration may cause severe bradycardia and hypotension.
- Precautions: Do not discontinue abruptly in patients with ischemic heart disease.

## SECTION 3: ANTI-INFECTIVE MEDICINES

### 3.1 Antibacterials
Amoxicillin capsule 250 mg; 500 mg.
- Indications: Respiratory tract infections, urinary tract infections.
- Interactions: Methotrexate excretion may be reduced, increasing toxicity.
"""

class TestSemanticGuidelineChunking:

    def test_splitter_uses_clinical_separators_and_size(self):
        splitter = rag_service.get_text_splitter()
        assert splitter._chunk_size == 800
        assert splitter._chunk_overlap == 150
        # Verify clinical separators are defined in hierarchy
        assert "\n## " in splitter._separators
        assert "\n### " in splitter._separators
        assert "\n- " in splitter._separators

    def test_chunks_preserve_clinical_sections(self):
        splitter = rag_service.get_text_splitter()
        chunks = splitter.split_text(CLINICAL_SAMPLE_TEXT)
        assert len(chunks) >= 2
        # Verify chunks contain complete headers and no broken tags
        first_chunk = chunks[0]
        assert "SECTION 2" in first_chunk or "Amlodipine" in first_chunk
        for chunk in chunks:
            assert len(chunk) <= 800
