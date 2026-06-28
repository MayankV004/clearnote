import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import Consultation, ConsultationStatus
from app.models.medication import Medication
from app.models.diagnosis import Diagnosis
from app.schemas.consultation import ConsultationUpdate, MedicationUpdate
from app.services.rag_service import rag_service
from app.services.consultation_service import ConsultationService
from app.core.logger import logger

async def test_rag_pipeline():
    logger.info("=== STARTING RAG PIPELINE TEST ===")
    async with AsyncSessionLocal() as db:
        # 1. Create a dummy doctor and patient
        doctor_id = uuid.uuid4()
        patient_id = uuid.uuid4()
        
        doc = Doctor(id=doctor_id, clerk_user_id=f"test_clerk_{doctor_id}", name="Test Doctor", email=f"test_doc_{doctor_id}@example.com")
        pat = Patient(id=patient_id, doctor_id=doctor_id, name="Test Patient", email=f"test_pat_{patient_id}@example.com")
        db.add(doc)
        db.add(pat)
        await db.commit()
        
        logger.info(f"Created Test Doctor ({doctor_id}) and Patient ({patient_id})")

        # 2. Create Consultation
        consultation = await ConsultationService.create_consultation(db, doctor_id, patient_id)
        logger.info(f"Created Consultation ({consultation.id})")

        # 3. Add initial medications (Warfarin and Aspirin) and diagnosis
        med1 = Medication(consultation_id=consultation.id, name="Warfarin", dosage="5mg", frequency="Once daily", duration="30 days")
        med2 = Medication(consultation_id=consultation.id, name="Aspirin", dosage="81mg", frequency="Once daily", duration="30 days")
        diag = Diagnosis(consultation_id=consultation.id, icd_code="I10", description="Essential hypertension")
        db.add(med1)
        db.add(med2)
        db.add(diag)
        await db.commit()
        
        logger.info("Added initial medications: Warfarin & Aspirin")

        # 4. Run RAG interaction check directly
        logger.info("Running RAG drug interaction check...")
        await rag_service.check_drug_interactions(
            consultation_id=str(consultation.id),
            medications=[med1, med2],
            diagnoses=[diag],
            db=db
        )
        
        # Verify interactions created
        stmt = select(Consultation).where(Consultation.id == consultation.id).options(
            selectinload(Consultation.medications),
            selectinload(Consultation.diagnoses),
            selectinload(Consultation.interactions)
        )
        consultation = await db.scalar(stmt)
        
        logger.info(f"Detected Interactions count: {len(consultation.interactions)}")
        for interaction in consultation.interactions:
            logger.info(f" -> Interaction: {interaction.drug_a} & {interaction.drug_b} | Severity: {interaction.severity} | Ref: {interaction.guideline_ref}")

        # 5. Test updating medications via ConsultationService (Replace Aspirin with Ibuprofen)
        logger.info("Updating medications via ConsultationService (Replace Aspirin with Ibuprofen)...")
        update_data = ConsultationUpdate(
            medications=[
                MedicationUpdate(id=med1.id, name="Warfarin", dosage="5mg", frequency="Once daily", duration="30 days"),
                MedicationUpdate(name="Ibuprofen", dosage="400mg", frequency="As needed", duration="7 days")
            ]
        )
        updated_consultation = await ConsultationService.update_consultation_details(
            db=db,
            doctor_id=doctor_id,
            consultation_id=consultation.id,
            update_data=update_data
        )
        
        logger.info(f"Post-update Detected Interactions count: {len(updated_consultation.interactions)}")
        for interaction in updated_consultation.interactions:
            logger.info(f" -> Updated Interaction: {interaction.drug_a} & {interaction.drug_b} | Severity: {interaction.severity} | Ref: {interaction.guideline_ref}")
        
        logger.info("=== RAG PIPELINE TEST SUCCESSFULLY COMPLETED ===")

if __name__ == "__main__":
    asyncio.run(test_rag_pipeline())
