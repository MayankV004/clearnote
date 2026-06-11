"""
Example routes demonstrating Clerk auth:

  GET /public     – no auth required
  GET /protected  – requires valid Clerk JWT, returns userId
  GET /me         – requires valid Clerk JWT, fetches full user from Clerk API
"""

import clerk_backend_api
from clerk_backend_api.security.types import RequestState
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.api.dependencies.auth import CurrentUser, get_current_user

router = APIRouter()

_clerk = clerk_backend_api.Clerk(bearer_auth=settings.CLERK_SECRET_KEY)


# ---------------------------------------------------------------------------
# Public – no authentication
# ---------------------------------------------------------------------------

@router.get("/public")
async def public_route():
    """Anyone can hit this endpoint."""
    return {"message": "This is a public endpoint — no auth required."}


# ---------------------------------------------------------------------------
# Protected – requires a valid Clerk JWT
# ---------------------------------------------------------------------------

@router.get("/protected")
async def protected_route(state: CurrentUser):
    """
    Returns the Clerk userId extracted from the JWT.

    The JWT payload contains `sub` = Clerk userId (e.g. "user_2abc…").
    """
    user_id: str = state.payload["sub"]
    return {"user_id": user_id, "message": "You are authenticated."}


# ---------------------------------------------------------------------------
# /me – requires auth, then fetches the full Clerk user object
# ---------------------------------------------------------------------------

@router.get("/me")
async def me_route(state: CurrentUser):
    """
    Returns the full Clerk user record (email, name, etc.).

    Uses the userId from the JWT to call the Clerk Backend API.
    """
    user_id: str = state.payload["sub"]

    user = _clerk.users.get(user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in Clerk.",
        )

    # Pick out the primary email address
    primary_email = next(
        (
            e.email_address
            for e in (user.email_addresses or [])
            if e.id == user.primary_email_address_id
        ),
        None,
    )

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": primary_email,
        "image_url": user.image_url,
    }
