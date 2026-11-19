"""
golden_dataset.py

Curated gold-standard clinical evaluation dataset for ClearNote.
Contains annotated transcripts, expected diagnoses (with ICD-10 codes),
expected medications, allergies, and drug-drug interactions for clinical benchmarking.
"""

from typing import List, Dict, Any

GOLDEN_CLINICAL_VIGNETTES: List[Dict[str, Any]] = [
    {
        "id": "GOLD-01",
        "title": "Acute Streptococcal Pharyngitis with Penicillin Anaphylaxis",
        "transcript": (
            "Doctor: Good morning. What brings you in today?\n"
            "Patient: Doctor, I've had a severe sore throat for the past three days. It hurts terribly when I swallow, "
            "and I had a fever of 101.5 yesterday at home.\n"
            "Doctor: Any cough, runny nose, or congestion?\n"
            "Patient: No cough at all, just intense throat pain and fever.\n"
            "Doctor: Let me examine you. Temperature is 38.6 Celsius, heart rate 88, blood pressure 120/78. "
            "Opening your mouth... Posterior pharynx is markedly erythematous, with bilateral tonsillar exudates. "
            "Tender bilateral anterior cervical lymph nodes palpable. This strongly indicates acute pharyngitis.\n"
            "Doctor: Do you have any medication allergies?\n"
            "Patient: Yes, I am severely allergic to penicillin. I had an anaphylactic reaction with hives and swollen throat as a child.\n"
            "Doctor: Understood. We must strictly avoid penicillin and amoxicillin. We will treat this with Azithromycin 500mg orally "
            "once daily for 3 days. Also use paracetamol 500mg as needed for fever and pain, stay well hydrated, and rest."
        ),
        "expected_diagnoses": [
            {"code_prefix": "J02", "name_contains": "pharyngitis"}
        ],
        "expected_medications": [
            {"name": "azithromycin", "dosage": "500mg"},
            {"name": "paracetamol", "dosage": "500mg"}
        ],
        "expected_allergies": ["penicillin"],
        "contraindicated_drugs": ["penicillin", "amoxicillin"],
    },
    {
        "id": "GOLD-02",
        "title": "Essential Hypertension & Knee Osteoarthritis with NSAID Interaction",
        "transcript": (
            "Doctor: Hello Mr. Davies. How have your knees and blood pressure been?\n"
            "Patient: My blood pressure has been okay, taking my pill every morning. But my right knee is killing me for the last 6 months. "
            "It's very stiff for twenty minutes when I wake up and hurts going down stairs.\n"
            "Doctor: Let's check your vitals. Blood pressure is 136/84 mmHg, pulse 72. On examination of the right knee, there is mild crepitus "
            "with flexion and extension, slight medial joint line tenderness, no significant joint effusion or erythema. "
            "This is consistent with primary osteoarthritis of the right knee alongside your chronic essential hypertension.\n"
            "Doctor: You are currently on Amlodipine 10mg once daily for your hypertension. We will continue your Amlodipine 10mg daily. "
            "For the knee pain, I will prescribe Ibuprofen 400mg orally three times daily with meals as needed. "
            "However, remember that NSAIDs like Ibuprofen can cause fluid retention and attenuate the antihypertensive effect of Amlodipine, "
            "so monitor your blood pressure weekly."
        ),
        "expected_diagnoses": [
            {"code_prefix": "I10", "name_contains": "hypertension"},
            {"code_prefix": "M17", "name_contains": "osteoarthritis"}
        ],
        "expected_medications": [
            {"name": "amlodipine", "dosage": "10mg"},
            {"name": "ibuprofen", "dosage": "400mg"}
        ],
        "expected_allergies": [],
        "expected_interactions": [
            {"drug_a": "amlodipine", "drug_b": "ibuprofen"}
        ],
    },
    {
        "id": "GOLD-03",
        "title": "Type 2 Diabetes with CKD Stage 4 & Metformin Lactic Acidosis Contraindication",
        "transcript": (
            "Doctor: Good afternoon. We received your comprehensive metabolic panel and renal function panel back from the lab.\n"
            "Patient: How do they look, doctor? Am I still on track?\n"
            "Doctor: Your HbA1c is 8.4%, but your renal function has unfortunately worsened. Your serum creatinine is up to 2.4 mg/dL "
            "and your estimated GFR has dropped to 28 mL/min/1.73m2. This confirms chronic kidney disease stage 4 secondary to type 2 diabetes.\n"
            "Patient: What does that mean for my medications? I take Metformin 1000mg twice a day.\n"
            "Doctor: Metformin is strictly contraindicated when eGFR falls below 30 mL/min due to the severe risk of fatal lactic acidosis. "
            "We must immediately discontinue your Metformin 1000mg. To safely control your blood sugar without stressing your kidneys, "
            "we will initiate Insulin Glargine 10 units subcutaneous injection once daily at bedtime. I am also referring you to nephrology."
        ),
        "expected_diagnoses": [
            {"code_prefix": "E11", "name_contains": "diabetes"},
            {"code_prefix": "N18", "name_contains": "kidney"}
        ],
        "expected_medications": [
            {"name": "metformin", "dosage": "1000mg"},
            {"name": "insulin glargine", "dosage": "10 units"}
        ],
        "expected_allergies": [],
        "contraindicated_drugs": ["metformin"],
    }
]
