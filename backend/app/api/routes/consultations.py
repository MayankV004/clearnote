
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies.auth import get_current_doctor
from app.api.dependencies.db import get_db
from app.core.exceptions import ConsultationNotFoundException, PatientNotOwnedException
from app.core.logger import logger
from app.models.consultation import Consultation, ConsultationStatus
from app.models.doctor import Doctor
from app.schemas.consultation import ConsultationCreate, ConsultationResponse, ConsultationUpdate
from app.services.consultation_service import ConsultationService
from app.services.pdf_service import pdf_service
from app.services.s3_service import s3_service
from app.core.config import settings
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/consultations", tags=["consultations"])


@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    body: ConsultationCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new consultation session.
    """
    return await ConsultationService.create_consultation(db, doctor.id, body.patient_id)


@router.get("/", response_model=List[ConsultationResponse])
async def list_consultations(
    patient_id: UUID,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    List all consultations for a specific patient.
    """
    return await ConsultationService.get_consultations_for_patient(db, doctor.id, patient_id)


@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(
    consultation_id: UUID,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single consultation by ID. Includes the SOAP note if completed.
    """
    return await ConsultationService.get_consultation_by_id(db, doctor.id, consultation_id)

@router.patch("/{consultation_id}",response_model=ConsultationResponse)
async def update_consultation_details(
    consultation_id:UUID,
    body:ConsultationUpdate,
    doctor:Doctor=Depends(get_current_doctor),
    db:AsyncSession=Depends(get_db),
):
    return await ConsultationService.update_consultation_details(
        db=db,
        doctor_id=doctor.id,
        consultation_id=consultation_id,
        update_data=body
    )

@router.websocket("/{consultation_id}/stream")
async def audio_stream(
    websocket: WebSocket,
    consultation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket endpoint for streaming audio directly from the browser's MediaRecorder.
    """
    await websocket.accept()
    
    # We fetch the consultation to ensure it exists.
    # Note: WebSocket doesn't run through the HTTP middleware, so we rely on the 
    # consultation_id which was just created securely via POST.
    stmt = select(Consultation).where(Consultation.id == consultation_id)
    consultation = await db.scalar(stmt)
    
    if not consultation:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Consultation not found")
        return

    audio_chunks = bytearray()
    
    # We need a BackgroundTasks instance since WebSockets don't provide one automatically
    background_tasks = BackgroundTasks()
    
    try:
        while True:
            # Receive binary chunks from the client
            data = await websocket.receive_bytes()
            audio_chunks.extend(data)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {consultation_id}. Total audio: {len(audio_chunks)} bytes.")
        
        # Connection closed - save and process the audio if we received any
        if len(audio_chunks) > 0:
            try:
                await ConsultationService.save_audio_and_transcribe(
                    db=db,
                    consultation=consultation,
                    audio_bytes=bytes(audio_chunks),
                    background_tasks=background_tasks
                )
                # WebSockets skip standard HTTP response background tasks execution,
                # so we must trigger them manually.
                await background_tasks()
            except Exception as exc:
                logger.error(
                    f"Failed to process audio for {consultation_id}: {exc}",
                    exc_info=True,
                )
                try:
                    await db.refresh(consultation)
                    consultation.status = ConsultationStatus.FAILED
                    consultation.processing_error = str(exc)
                    await db.commit()
                    logger.info(f"Consultation {consultation_id}: marked FAILED after audio processing error.")
                except Exception as commit_exc:
                    logger.error(
                        f"Could not save FAILED status for {consultation_id}: {commit_exc}"
                    )

@router.post("/{consultation_id}/prescription", response_model=dict)
async def generate_prescription(
    consultation_id: UUID,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a PDF prescription for a completed consultation.
    Returns the presigned URL for the generated PDF.
    """
    # Verify ownership
    stmt = select(Consultation).where(Consultation.id == consultation_id, Consultation.doctor_id == doctor.id)
    consultation = await db.scalar(stmt)
    if not consultation:
        raise ConsultationNotFoundException(str(consultation_id))
    
    if consultation.status != ConsultationStatus.COMPLETE:
        return JSONResponse(status_code=400, content={"message": "Consultation is not complete yet."})

    # Generate PDF
    try:
        s3_key = await pdf_service.generate_prescription_pdf(db, str(consultation_id))
        presigned_url = await s3_service.generate_presigned_url(s3_key, bucket_name=settings.PDF_BUCKET_NAME)
        return {"url": presigned_url}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"message": str(e)})

@router.get("/{consultation_id}/prescription", response_model=dict)
async def get_prescription(
    consultation_id: UUID,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the presigned URL for an already generated PDF prescription.
    """
    stmt = select(Consultation).where(Consultation.id == consultation_id, Consultation.doctor_id == doctor.id)
    consultation = await db.scalar(stmt)
    if not consultation:
        raise ConsultationNotFoundException(str(consultation_id))

    if not consultation.prescription_s3_key:
        return JSONResponse(status_code=404, content={"message": "Prescription not generated yet."})

    presigned_url = await s3_service.generate_presigned_url(consultation.prescription_s3_key, bucket_name=settings.PDF_BUCKET_NAME)
    return {"url": presigned_url}
