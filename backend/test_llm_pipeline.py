import asyncio
import os
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import Consultation, ConsultationStatus
from app.models.soap_note import SOAPNote
from app.models.medication import Medication
from app.models.diagnosis import Diagnosis
from app.services.consultation_service import _run_transcription

async def run_test():
    async with AsyncSessionLocal() as db:
        # Create a dummy doctor, patient, and consultation for testing
        doctor = Doctor(clerk_user_id="test_doctor_123", email="test@example.com", name="Dr. Test")
        db.add(doctor)
        await db.commit()
        await db.refresh(doctor)
        
        patient = Patient(doctor_id=doctor.id, name="Test Patient", email="testp@example.com", phone="123")
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
        
        consultation = Consultation(patient_id=patient.id, doctor_id=doctor.id, status=ConsultationStatus.PENDING)
        db.add(consultation)
        await db.commit()
        await db.refresh(consultation)
        
        print(f"Created test consultation {consultation.id}")
        
        # We need a valid audio file in S3 for Deepgram to transcribe.
        # But wait! We don't have a fake audio file in S3 right now.
        # Let's bypass the S3/Deepgram part and directly test the LLM part if we want, 
        # OR we can just use the actual _run_transcription if we upload a tiny fake audio file.
        
        # Since generating fake audio and uploading it to S3 just to test LLM is flaky,
        # let's directly test `extract_structured_data` and then the DB insert.
        
        from app.services.llm_service import llm_service
        
        sample_transcript = "Patient complains of a severe headache for the past 3 days. I am prescribing Ibuprofen 400mg twice a day for 5 days orally. Diagnosis is acute tension headache. No allergies mentioned."
        
        print("Calling Groq LLM...")
        structured_data = await llm_service.extract_structured_data(sample_transcript)
        print("Groq Extraction Result:", structured_data.model_dump_json(indent=2))
        
        print("Saving to DB...")
        soap_note = SOAPNote(
            consultation_id=consultation.id,
            raw_transcript=sample_transcript,
            subjective=structured_data.subjective,
            objective=structured_data.objective,
            assessment=structured_data.assessment,
            plan=structured_data.plan,
        )
        db.add(soap_note)

        for med in structured_data.medications:
            db.add(Medication(
                consultation_id=consultation.id,
                name=med.name,
                dosage=med.dosage,
                frequency=med.frequency,
                duration=med.duration,
                route=med.route
            ))

        for diag in structured_data.diagnoses:
            db.add(Diagnosis(
                consultation_id=consultation.id,
                icd_code=diag.icd_code,
                description=diag.description
            ))
        
        consultation.status = ConsultationStatus.COMPLETE
        await db.commit()
        
        print("Successfully saved to DB! Test complete.")
        
        # Clean up
        await db.execute(text("DELETE FROM medications WHERE consultation_id = :id"), {"id": consultation.id})
        await db.execute(text("DELETE FROM diagnoses WHERE consultation_id = :id"), {"id": consultation.id})
        await db.execute(text("DELETE FROM soap_notes WHERE consultation_id = :id"), {"id": consultation.id})
        await db.execute(text("DELETE FROM consultations WHERE id = :id"), {"id": consultation.id})
        await db.execute(text("DELETE FROM patients WHERE id = :id"), {"id": patient.id})
        await db.execute(text("DELETE FROM doctors WHERE id = :id"), {"id": doctor.id})
        await db.commit()

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_test())
