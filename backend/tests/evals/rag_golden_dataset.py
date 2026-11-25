"""
rag_golden_dataset.py

Manually labelled clinical guideline corpus and query-to-guideline relevance
dataset for evaluating ClearNote's RAG retrieval pipeline (Precision@3,
Recall@3, and MRR).

Each guideline document represents an excerpt formatted in the style of
WHO Model Formulary / ICMR Standard Treatment Guidelines. Queries correspond
to pairwise medication + diagnosis contexts evaluated by
`RAGService.build_interaction_query`.
"""

from typing import TypedDict


class GuidelineDoc(TypedDict):
    doc_id: str
    source: str
    page: int
    content: str


class RetrievalQueryCase(TypedDict):
    query_id: str
    drug_a: str
    drug_b: str
    diag_context: str
    relevant_doc_ids: list[str]
    clinical_rationale: str


# 18 curated clinical guideline passages (targets + realistic same-domain distractors)
GUIDELINE_CORPUS: list[GuidelineDoc] = [
    {
        "doc_id": "WHO-CARDIO-01",
        "source": "WHO Model Formulary 2023",
        "page": 47,
        "content": (
            "## Antihypertensives & NSAIDs\n"
            "### Amlodipine — Ibuprofen / Non-steroidal anti-inflammatory drugs\n"
            "- Interaction (Moderate): NSAIDs such as ibuprofen and naproxen inhibit renal "
            "prostaglandin synthesis, causing sodium and fluid retention that attenuates the "
            "antihypertensive efficacy of calcium channel blockers like amlodipine and ACE inhibitors.\n"
            "- Recommendation: Monitor blood pressure regularly; consider paracetamol as a safer "
            "short-term analgesic alternative in essential hypertension."
        ),
    },
    {
        "doc_id": "WHO-CARDIO-02",
        "source": "WHO Model Formulary 2023",
        "page": 52,
        "content": (
            "## Antihypertensives & Lipid-Lowering Agents\n"
            "### Amlodipine — Simvastatin\n"
            "- Interaction (Moderate): Amlodipine inhibits CYP3A4-mediated metabolism of simvastatin, "
            "increasing systemic simvastatin exposure and risk of myopathy or rhabdomyolysis.\n"
            "- Recommendation: Do not exceed simvastatin 20 mg once daily when co-prescribed with "
            "amlodipine, or switch to rosuvastatin / pravastatin."
        ),
    },
    {
        "doc_id": "WHO-CARDIO-03",
        "source": "WHO Model Formulary 2023",
        "page": 58,
        "content": (
            "## ACE Inhibitors & Potassium-Sparing Diuretics\n"
            "### Lisinopril — Spironolactone\n"
            "- Interaction (Severe): Co-administration of ACE inhibitors (lisinopril, enalapril) "
            "with potassium-sparing diuretics (spironolactone) causes additive potassium retention, "
            "creating a high risk of life-threatening hyperkalaemia, especially in heart failure or CKD.\n"
            "- Recommendation: Avoid routine combination unless closely monitoring serum potassium "
            "and renal function."
        ),
    },
    {
        "doc_id": "WHO-CARDIO-04",
        "source": "WHO Model Formulary 2023",
        "page": 61,
        "content": (
            "## Beta-Blockers & Non-Dihydropyridine Calcium Channel Blockers\n"
            "### Atenolol — Verapamil\n"
            "- Interaction (Severe): Concurrent use of beta-blockers (atenolol, metoprolol) and "
            "verapamil produces additive negative inotropic and chronotropic effects on AV nodal "
            "conduction, risking severe bradycardia, heart block, and acute heart failure.\n"
            "- Recommendation: Combination is contraindicated in left ventricular dysfunction."
        ),
    },
    {
        "doc_id": "WHO-ANTICOAG-01",
        "source": "WHO Model Formulary 2023",
        "page": 112,
        "content": (
            "## Oral Anticoagulants & Antiplatelets\n"
            "### Warfarin — Aspirin\n"
            "- Interaction (Severe): Aspirin inhibits platelet aggregation and erodes gastric mucosa; "
            "combined with warfarin it markedly increases major gastrointestinal and intracranial "
            "haemorrhage risk.\n"
            "- Recommendation: Avoid concurrent aspirin unless specifically indicated (e.g. mechanical "
            "heart valve); monitor INR frequently and add gastroprotection."
        ),
    },
    {
        "doc_id": "WHO-ANTICOAG-02",
        "source": "WHO Model Formulary 2023",
        "page": 114,
        "content": (
            "## Oral Anticoagulants & NSAIDs\n"
            "### Warfarin — Ibuprofen\n"
            "- Interaction (Severe): Ibuprofen displaces warfarin from plasma albumin and impairs "
            "platelet function while causing gastric mucosal injury, substantially elevating bleeding risk.\n"
            "- Recommendation: Contraindicated for routine analgesia in anticoagulated patients; "
            "use paracetamol and check INR."
        ),
    },
    {
        "doc_id": "WHO-ANTICOAG-03",
        "source": "WHO Model Formulary 2023",
        "page": 119,
        "content": (
            "## Oral Anticoagulants & Antimicrobials\n"
            "### Warfarin — Metronidazole\n"
            "- Interaction (Severe): Metronidazole inhibits CYP2C9 hepatic clearance of S-warfarin, "
            "prolonging prothrombin time and INR and precipitating severe bleeding.\n"
            "- Recommendation: Reduce warfarin dose empirically or select an alternative antibiotic "
            "while checking INR every 48-72 hours."
        ),
    },
    {
        "doc_id": "WHO-DIAB-01",
        "source": "ICMR Standard Treatment Guidelines 2024",
        "page": 88,
        "content": (
            "## Antidiabetic Therapy & Renal Impairment\n"
            "### Metformin — Iodinated Contrast / Stage 4 CKD Contraindication\n"
            "- Contraindication (Severe): Metformin clearance depends on glomerular filtration. In "
            "chronic kidney disease stage 4 (eGFR < 30 mL/min/1.73m2) or when combined with nephrotoxic "
            "agents or iodinated contrast media, metformin accumulates and causes fatal lactic acidosis.\n"
            "- Recommendation: Discontinue metformin immediately when eGFR < 30; transition to insulin "
            "glargine."
        ),
    },
    {
        "doc_id": "WHO-DIAB-02",
        "source": "ICMR Standard Treatment Guidelines 2024",
        "page": 92,
        "content": (
            "## Antidiabetic Therapy & Beta-Blockers\n"
            "### Insulin Glargine — Propranolol\n"
            "- Interaction (Moderate): Non-selective beta-blockers like propranolol mask adrenergic "
            "warning signs of hypoglycaemia (tachycardia, tremor) and delay glycogenolytic recovery "
            "in patients receiving insulin.\n"
            "- Recommendation: Counsel patients on sweating as a preserved warning sign and monitor "
            "capillary blood glucose closely."
        ),
    },
    {
        "doc_id": "WHO-INFECT-01",
        "source": "WHO Model Formulary 2023",
        "page": 143,
        "content": (
            "## Macrolides & Statins\n"
            "### Clarithromycin — Simvastatin\n"
            "- Interaction (Severe): Clarithromycin strongly inhibits CYP3A4 and OATP1B1 hepatic "
            "uptake, raising simvastatin plasma concentrations several-fold and triggering acute "
            "rhabdomyolysis.\n"
            "- Recommendation: Suspend simvastatin during clarithromycin therapy or prescribe "
            "azithromycin, which does not inhibit CYP3A4."
        ),
    },
    {
        "doc_id": "WHO-INFECT-02",
        "source": "WHO Model Formulary 2023",
        "page": 149,
        "content": (
            "## Penicillins & Antimetabolites\n"
            "### Amoxicillin — Methotrexate\n"
            "- Interaction (Severe): Penicillins including amoxicillin compete with methotrexate "
            "for renal tubular secretion, reducing methotrexate clearance and risking pancytopenia "
            "and mucosal toxicity.\n"
            "- Recommendation: Avoid concurrent high-dose methotrexate and monitor CBC and renal "
            "function closely."
        ),
    },
    {
        "doc_id": "WHO-INFECT-03",
        "source": "WHO Model Formulary 2023",
        "page": 154,
        "content": (
            "## Fluoroquinolones & Corticosteroids\n"
            "### Ciprofloxacin — Prednisolone\n"
            "- Interaction (Moderate): Concurrent systemic corticosteroids and fluoroquinolones "
            "increase the risk of Achilles tendinitis and tendon rupture, particularly in older adults.\n"
            "- Recommendation: Advise patients to discontinue ciprofloxacin immediately at the first "
            "sign of tendon pain or inflammation."
        ),
    },
    {
        "doc_id": "WHO-PSYCH-01",
        "source": "ICMR Standard Treatment Guidelines 2024",
        "page": 201,
        "content": (
            "## Serotonergic Antidepressants & Opioid Analgesics\n"
            "### Fluoxetine — Tramadol\n"
            "- Interaction (Severe): Fluoxetine inhibits CYP2D6 activation of tramadol and increases "
            "synaptic serotonin; co-administration risks serotonin syndrome (hyperthermia, clonus, "
            "agitation) and lowered seizure threshold.\n"
            "- Recommendation: Avoid tramadol with SSRIs; choose a non-serotonergic analgesic."
        ),
    },
    {
        "doc_id": "WHO-CARDIO-05",
        "source": "WHO Model Formulary 2023",
        "page": 64,
        "content": (
            "## Cardiac Glycosides & Potassium-Depleting Diuretics\n"
            "### Digoxin — Furosemide\n"
            "- Interaction (Moderate): Loop diuretics such as furosemide induce hypokalaemia and "
            "hypomagnesaemia, sensitizing myocardium to digoxin toxicity and ventricular arrhythmias.\n"
            "- Recommendation: Monitor serum potassium and magnesium; supplement electrolytes as needed."
        ),
    },
    # Realistic clinical distractors (related drug classes, different pairings)
    {
        "doc_id": "DIST-CARDIO-06",
        "source": "WHO Model Formulary 2023",
        "page": 68,
        "content": (
            "## Thiazide Diuretics — Monotherapy Dosing\n"
            "### Hydrochlorothiazide\n"
            "- Indications: Mild to moderate hypertension and peripheral oedema.\n"
            "- Dosage: 12.5 mg to 25 mg orally once daily in the morning.\n"
            "- Monitoring: Check baseline electrolytes and uric acid after 4 weeks."
        ),
    },
    {
        "doc_id": "DIST-ANALG-01",
        "source": "WHO Model Formulary 2023",
        "page": 29,
        "content": (
            "## Non-Opioid Analgesics — Hepatic Precautions\n"
            "### Paracetamol (Acetaminophen)\n"
            "- Indications: Mild to moderate pain and pyrexia.\n"
            "- Precautions: Maximum adult dose 4 g per 24 hours; reduce dose in chronic alcohol "
            "use or hepatic impairment to avoid centrilobular hepatotoxicity."
        ),
    },
    {
        "doc_id": "DIST-INFECT-04",
        "source": "WHO Model Formulary 2023",
        "page": 139,
        "content": (
            "## Macrolides — Streptococcal Pharyngitis Alternative\n"
            "### Azithromycin\n"
            "- Indications: Acute bacterial pharyngitis in patients with severe penicillin anaphylaxis.\n"
            "- Dosage: 500 mg orally once daily for 3 days. Monitor QT interval in predisposed patients."
        ),
    },
    {
        "doc_id": "DIST-GASTRO-01",
        "source": "WHO Model Formulary 2023",
        "page": 182,
        "content": (
            "## Proton Pump Inhibitors — Antiplatelet Interaction\n"
            "### Omeprazole — Clopidogrel\n"
            "- Interaction (Moderate): Omeprazole inhibits CYP2C19 bioactivation of clopidogrel, "
            "reducing antiplatelet efficacy.\n"
            "- Recommendation: Prefer pantoprazole when gastroprotection is required alongside clopidogrel."
        ),
    },
]


# 12 manually labelled retrieval test queries matching ClearNote's pairwise query format
RETRIEVAL_EVAL_QUERIES: list[RetrievalQueryCase] = [
    {
        "query_id": "RAG-Q01",
        "drug_a": "Amlodipine",
        "drug_b": "Ibuprofen",
        "diag_context": "Essential hypertension, Primary osteoarthritis of right knee",
        "relevant_doc_ids": ["WHO-CARDIO-01"],
        "clinical_rationale": "NSAID attenuates calcium channel blocker antihypertensive efficacy.",
    },
    {
        "query_id": "RAG-Q02",
        "drug_a": "Amlodipine",
        "drug_b": "Simvastatin",
        "diag_context": "Hypertension, Dyslipidemia",
        "relevant_doc_ids": ["WHO-CARDIO-02"],
        "clinical_rationale": "CYP3A4 inhibition increases simvastatin myopathy risk (20mg cap).",
    },
    {
        "query_id": "RAG-Q03",
        "drug_a": "Lisinopril",
        "drug_b": "Spironolactone",
        "diag_context": "Heart failure with reduced ejection fraction, Hypertension",
        "relevant_doc_ids": ["WHO-CARDIO-03"],
        "clinical_rationale": "Dual potassium retention causes severe hyperkalaemia.",
    },
    {
        "query_id": "RAG-Q04",
        "drug_a": "Atenolol",
        "drug_b": "Verapamil",
        "diag_context": "Angina pectoris, Atrial arrhythmias",
        "relevant_doc_ids": ["WHO-CARDIO-04"],
        "clinical_rationale": "Additive AV nodal blockade causing bradycardia and heart block.",
    },
    {
        "query_id": "RAG-Q05",
        "drug_a": "Warfarin",
        "drug_b": "Aspirin",
        "diag_context": "Atrial fibrillation, Coronary artery disease",
        "relevant_doc_ids": ["WHO-ANTICOAG-01"],
        "clinical_rationale": "Dual antithrombotic increases major GI/intracranial haemorrhage risk.",
    },
    {
        "query_id": "RAG-Q06",
        "drug_a": "Warfarin",
        "drug_b": "Ibuprofen",
        "diag_context": "Deep vein thrombosis, Knee pain",
        "relevant_doc_ids": ["WHO-ANTICOAG-02"],
        "clinical_rationale": "NSAID displaces warfarin and increases GI bleeding.",
    },
    {
        "query_id": "RAG-Q07",
        "drug_a": "Warfarin",
        "drug_b": "Metronidazole",
        "diag_context": "Atrial fibrillation, Anaerobic bacterial infection",
        "relevant_doc_ids": ["WHO-ANTICOAG-03"],
        "clinical_rationale": "CYP2C9 inhibition elevates INR and haemorrhage risk.",
    },
    {
        "query_id": "RAG-Q08",
        "drug_a": "Insulin Glargine",
        "drug_b": "Propranolol",
        "diag_context": "Type 2 diabetes mellitus, Essential tremor",
        "relevant_doc_ids": ["WHO-DIAB-02"],
        "clinical_rationale": "Beta-blocker masks adrenergic hypoglycaemia warning symptoms.",
    },
    {
        "query_id": "RAG-Q09",
        "drug_a": "Clarithromycin",
        "drug_b": "Simvastatin",
        "diag_context": "Community-acquired pneumonia, Hypercholesterolemia",
        "relevant_doc_ids": ["WHO-INFECT-01"],
        "clinical_rationale": "Strong CYP3A4/OATP1B1 inhibition precipitates rhabdomyolysis.",
    },
    {
        "query_id": "RAG-Q10",
        "drug_a": "Amoxicillin",
        "drug_b": "Methotrexate",
        "diag_context": "Respiratory tract infection, Rheumatoid arthritis",
        "relevant_doc_ids": ["WHO-INFECT-02"],
        "clinical_rationale": "Reduced renal tubular secretion increases methotrexate toxicity.",
    },
    {
        "query_id": "RAG-Q11",
        "drug_a": "Ciprofloxacin",
        "drug_b": "Prednisolone",
        "diag_context": "Urinary tract infection, COPD exacerbation",
        "relevant_doc_ids": ["WHO-INFECT-03"],
        "clinical_rationale": "Combined steroid and fluoroquinolone raises tendon rupture risk.",
    },
    {
        "query_id": "RAG-Q12",
        "drug_a": "Fluoxetine",
        "drug_b": "Tramadol",
        "diag_context": "Major depressive disorder, Chronic low back pain",
        "relevant_doc_ids": ["WHO-PSYCH-01"],
        "clinical_rationale": "Serotonergic excess and CYP2D6 inhibition cause serotonin syndrome.",
    },
]
