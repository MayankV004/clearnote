from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    ConsultationNotFoundException,
    PatientNotFoundException,
    PatientNotOwnedException,
    DoctorNotFoundException,
)
from app.api.dependencies.db import get_db
from app.api.routes.examples import router as examples_router
from app.api.routes.webhooks import router as webhooks_router
from app.api.routes.patients import router as patients_router
from app.api.routes.doctors import router as doctors_router
from app.api.routes.consultations import router as consultations_router
from app.api.routes.data_deletion import router as data_deletion_router
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter

from app.middleware.security_header import SecurityHeadersMiddleware, RequestLoggingMiddleware

app = FastAPI(title="ClearNote API")


# Rate Limiter Initialization
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)


#Routes

app.include_router(examples_router)   
app.include_router(webhooks_router)
app.include_router(patients_router)
app.include_router(doctors_router)
app.include_router(consultations_router)
app.include_router(data_deletion_router)


#Exception Handlers
@app.exception_handler(ConsultationNotFoundException)
async def consultation_not_found_handler(request: Request, exc: ConsultationNotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(PatientNotFoundException)
async def patient_not_found_handler(request: Request, exc: PatientNotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(DoctorNotFoundException)
async def doctor_not_found_handler(request: Request, exc: DoctorNotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(PatientNotOwnedException)
async def patient_not_owned_handler(request: Request, exc: PatientNotOwnedException):
    return JSONResponse(status_code=403, content={"detail": exc.message})

# health check 

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health check probe failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "version": "1.0.0"
    }


@app.get("/db-test")
async def db_test(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(text("SELECT 1"))

    return {
        "ok": result.scalar()
    }