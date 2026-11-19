from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError
from app.core.config import settings
from app.api.dependencies.db import get_db
from app.models.doctor import Doctor
from sqlalchemy.dialects.postgresql import insert
from app.core.logger import logger, mask_email, mask_phone

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    headers = request.headers

    # Extract Svix headers
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        logger.error("Webhook failed: Missing svix headers")
        raise HTTPException(status_code=400, detail="Missing svix headers")

    wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
    
    try:
        event = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        })
    except WebhookVerificationError:
        logger.error("Webhook failed: Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "user.created":
        data = event["data"]
        clerk_id = data["id"]
        email = data["email_addresses"][0]["email_address"]
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        name = f"{first_name} {last_name}".strip()

        from app.services.doctor_service import DoctorService
        await DoctorService.create_doctor_from_clerk(db, clerk_id, email, name)
        logger.info(f"Successfully processed clerk webhook: created user {mask_email(email)}")

    return {"status": "ok"}


@router.post("/twilio")
async def twilio_webhook(request: Request):
    # Twilio sends data as application/x-www-form-urlencoded
    try:
        data = await request.form()
        message_status = data.get("MessageStatus")
        message_sid = data.get("MessageSid")
        to_number = data.get("To")
        logger.info(f"Twilio Webhook: Message {message_sid} to {mask_phone(to_number)} status is {message_status}")
    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}")
    return {"status": "ok"}


@router.post("/sendgrid")
async def sendgrid_webhook(request: Request):
    # SendGrid sends an array of events as application/json
    try:
        events = await request.json()
        if isinstance(events, list):
            for event in events:
                email = event.get("email")
                event_type = event.get("event")
                logger.info(f"SendGrid Webhook: Event '{event_type}' for email {mask_email(email)}")
    except Exception as e:
        logger.error(f"Error processing SendGrid webhook: {e}")
    return {"status": "ok"}
