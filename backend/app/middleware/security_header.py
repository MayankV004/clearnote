from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.logger import logger
from app.db.session import AsyncSessionLocal
from app.models.audit_log import AuditLog
import asyncio

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self';"
        return response



class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log request start
        logger.info(f"[REQUEST] {request.method} {request.url}")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        logger.info(f"[RESPONSE] {response.status_code} {request.method} {request.url}")

        if request.method in ["POST","PUT","DELETE","PATCH"]:
            ip = request.client.host if request.client else None
            user_id = getattr(request.state , "user_id" , None)
            payload = None

            if not user_id:
                logger.warning("User ID not found in request state")
                return response

            async def write_audit_log():
                try:
                    async with AsyncSessionLocal() as session:
                        log_entry = AuditLog(
                            user_id=str(user_id),
                            action=request.method,
                            target_resource=request.url.path,
                            payload=payload,
                            ip_address=ip,
                            status_code=response.status_code,
                        )

                        session.add(log_entry)
                        await session.commit()
                except Exception as exc:
                    logger.error(f"Failed to write audit log: {exc}")


            await write_audit_log()
        return response