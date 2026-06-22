import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader

from app.core.logger import logger
from app.models.consultation import Consultation
from app.services.s3_service import s3_service

class PDFService:
    def __init__(self):
        # Set up Jinja2 environment to load templates from the templates directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(current_dir, 'templates')
        self.env = Environment(loader=FileSystemLoader(template_dir))

    async def generate_prescription_pdf(self, db: AsyncSession, consultation_id: str) -> str:
        """
        Generate a PDF prescription for a given consultation and upload it to S3.
        Returns the S3 key of the generated PDF.
        """
        # 1. Fetch all necessary data
        stmt = (
            select(Consultation)
            .options(
                selectinload(Consultation.doctor),
                selectinload(Consultation.patient),
                selectinload(Consultation.soap_note),
                selectinload(Consultation.medications),
                selectinload(Consultation.diagnoses)
            )
            .where(Consultation.id == consultation_id)
        )
        consultation = await db.scalar(stmt)

        if not consultation:
            raise ValueError(f"Consultation {consultation_id} not found.")

        if not consultation.soap_note:
            raise ValueError(f"Cannot generate prescription: SOAP note missing for consultation {consultation_id}.")

        logger.info(f"Generating PDF prescription for consultation {consultation_id}...")

        # 2. Render HTML template with data
        template = self.env.get_template('prescription_template.html')
        html_out = template.render(
            consultation=consultation,
            doctor=consultation.doctor,
            patient=consultation.patient,
            soap_note=consultation.soap_note,
            medications=consultation.medications,
            diagnoses=consultation.diagnoses,
            str=str  # Pass str built-in for type conversion in template
        )

        # 3. Convert HTML to PDF bytes using WeasyPrint
        pdf_bytes = HTML(string=html_out).write_pdf()

        # 4. Upload to S3
        s3_key = await s3_service.upload_pdf(pdf_bytes, str(consultation_id))

        # 5. Update Consultation record
        consultation.prescription_s3_key = s3_key
        await db.commit()

        logger.info(f"Successfully generated and uploaded prescription: {s3_key}")
        return s3_key

pdf_service = PDFService()
