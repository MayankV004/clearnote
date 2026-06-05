from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError
from app.core.config import settings
from app.db.session import get_db
from app.db.models.doctor import Doctor
from sqlalchemy.dialects.postgresql import insert

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
        raise HTTPException(status_code=400, detail="Missing svix headers")

    wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
    
    try:
        event = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        })
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "user.created":
        data = event["data"]
        clerk_id = data["id"]
        email = data["email_addresses"][0]["email_address"]
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        name = f"{first_name} {last_name}".strip()

        # Insert doctor record, ignore if clerk_user_id already exists
        stmt = insert(Doctor).values(
            clerk_user_id=clerk_id,
            email=email,
            name=name
        ).on_conflict_do_nothing(index_elements=["clerk_user_id"])
        
        await db.execute(stmt)
        await db.commit()

    return {"status": "ok"}
