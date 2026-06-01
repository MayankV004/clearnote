"""
Clerk JWT authentication dependency.

The Clerk Python SDK exposes `authenticate_request` as a module-level function
in `clerk_backend_api`. It accepts any object with a `.headers` mapping
(FastAPI's `Request` qualifies) and returns a `RequestState`.

Usage in any route:
    from app.deps.auth import get_current_user
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=reason,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return request_state


# Convenience type alias — use this in route signatures instead of the
# verbose Annotated[...] form.
CurrentUser = Annotated[RequestState, Depends(get_current_user)]
