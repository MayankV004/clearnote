"""
Clerk JWT authentication dependency.

The Clerk Python SDK exposes `authenticate_request` as a module-level function
in `clerk_backend_api`. It accepts any object with a `.headers` mapping
(FastAPI's `Request` qualifies) and returns a `RequestState`.

Usage in any route:
    from app.api.dependencies.auth import get_current_user
    from clerk_backend_api.security.types import RequestState

    @app.get("/protected")
    async def protected(state: RequestState = Depends(get_current_user)):
        user_id = state.payload["sub"]
"""

from typing import Annotated

import clerk_backend_api
from clerk_backend_api.security.types import AuthenticateRequestOptions, RequestState
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.core.logger import logger

from app.models.doctor import Doctor
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.dependencies.db import get_db

async def get_current_user(request: Request) -> RequestState:
    """
    Verify the Clerk JWT in the Authorization: Bearer <token> header.

    Returns the authenticated RequestState on success.
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    request_state = clerk_backend_api.authenticate_request(
        request,                               # FastAPI Request satisfies Requestish
        AuthenticateRequestOptions(
            secret_key=settings.CLERK_SECRET_KEY,
            authorized_parties=settings.CLERK_AUTHORIZED_PARTIES,
        ),
    )

    if not request_state.is_signed_in:
        # request_state.message gives a human-readable reason (e.g. "Token expired")
        reason = request_state.message or "Not authenticated"
        logger.warning(f"Clerk authentication failed: {reason}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=reason,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return request_state


# Convenience type alias — use this in route signatures instead of the
# verbose Annotated[...] form.
CurrentUser = Annotated[RequestState, Depends(get_current_user)]

async def get_current_doctor(state: CurrentUser, db: AsyncSession = Depends(get_db)) -> Doctor:
    """
    Resolve the internal Doctor record from the Clerk JWT sub claim.

    The doctor object is cached in Redis by clerk_user_id to avoid a
    DB round-trip on every authenticated request.
    """
    from app.services.cache_service import cache, key_doctor, TTL_DOCTOR
    from app.schemas.doctor import DoctorResponse

    clerk_user_id = state.payload["sub"]
    cache_key = key_doctor(clerk_user_id)

    # ── Cache read ───────────────────────────────────────────────────────────
    cached = await cache.get(cache_key)
    if cached is not None:
        # Return Pydantic model directly — Doctor(**cached) breaks because JSON
        # deserialises datetime fields as strings, not datetime objects.
        # DoctorResponse has all attrs (.id, .clerk_user_id, .is_onboarded) that
        # downstream service methods access.
        return DoctorResponse.model_validate(cached)

    # ── Cache miss → DB ──────────────────────────────────────────────────────
    stmt = select(Doctor).where(Doctor.clerk_user_id == clerk_user_id)
    doctor = await db.scalar(stmt)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found in database. Make sure you signed up correctly."
        )

    # Serialise via Pydantic schema and write to cache
    try:
        doctor_dict = DoctorResponse.model_validate(doctor).model_dump(mode="json")
        await cache.set(cache_key, doctor_dict, TTL_DOCTOR)
    except Exception as exc:
        logger.warning(f"Could not cache doctor {clerk_user_id}: {exc}")

    # Inject RLS configuration into the current database transaction
    from sqlalchemy import text
    try:
        await db.execute(text(f"SELECT set_config('app.current_doctor_id', '{doctor.id}', true)"))
    except Exception as e:
        logger.warning(f"Failed to set RLS config for {doctor.id}: {e}")

    return doctor
