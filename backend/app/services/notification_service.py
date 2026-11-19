import httpx
from typing import List
from app.core.config import settings
from app.core.logger import logger, mask_email, mask_phone
from app.models.medication import Medication

class NotificationService:
    @staticmethod
    async def send_prescription_email(patient_email: str, pdf_url: str) -> bool:
        """
        Send the prescription PDF URL to the patient via SendGrid.
        """
        if not settings.SENDGRID_API_KEY:
            logger.warning("SendGrid API key not configured. Skipping email notification.")
            return False

        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "personalizations": [
                {
                    "to": [{"email": patient_email}],
                    "subject": "Your Prescription from ClearNote"
                }
            ],
            "from": {"email": getattr(settings, 'SENDGRID_FROM_EMAIL', 'noreply@clearnote.com')},
            "content": [
                {
                    "type": "text/plain",
                    "value": f"Hello,\n\nYour prescription has been generated. You can download it securely from the following link:\n{pdf_url}\n\nNote: This link will expire shortly.\n\nBest regards,\nClearNote Team"
                }
            ]
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Prescription email sent successfully to {mask_email(patient_email)}")
                return True
        except Exception as e:
            logger.error(f"Failed to send prescription email to {mask_email(patient_email)}: {e}")
            return False

    @staticmethod
    async def send_medication_reminders(patient_phone: str, medications: List[Medication]) -> bool:
        """
        Send medication reminders via Twilio SMS.
        """
        if not getattr(settings, 'TWILIO_ACCOUNT_SID', None) or not getattr(settings, 'TWILIO_AUTH_TOKEN', None) or not getattr(settings, 'TWILIO_PHONE_NUMBER', None):
            logger.warning("Twilio credentials not fully configured. Skipping SMS reminders.")
            return False

        if not patient_phone:
            logger.warning("Patient phone number not provided. Skipping SMS reminders.")
            return False

        if not medications:
            return False

        med_list = "\n".join([f"- {m.name}: {m.dosage} ({m.frequency})" for m in medications])
        message_body = f"ClearNote Reminder:\nPlease remember to take your medications:\n{med_list}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        data = {
            "To": patient_phone,
            "From": settings.TWILIO_PHONE_NUMBER,
            "Body": message_body
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    data=data,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.info(f"Medication reminder SMS sent to {mask_phone(patient_phone)}")
                return True
        except Exception as e:
            logger.error(f"Failed to send medication reminder SMS to {mask_phone(patient_phone)}: {e}")
            return False

notification_service = NotificationService()
