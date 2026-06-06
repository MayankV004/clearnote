from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.api.routes.examples import router as examples_router
from app.api.routes.webhooks import router as webhooks_router
from app.api.routes.patients import router as patients_router

app = FastAPI(title="ClearNote API")


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(examples_router)   # /public, /protected, /me
app.include_router(webhooks_router)
app.include_router(patients_router)


# ---------------------------------------------------------------------------
# Core routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/db-test")
async def db_test(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(text("SELECT 1"))

    return {
        "ok": result.scalar()
    }