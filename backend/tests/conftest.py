"""
tests/conftest.py
─────────────────
Shared fixtures available to every test in the suite.

Strategy
────────
• We use an **in-memory SQLite** database (via aiosqlite) so tests never
  touch the real Postgres/NeonDB instance and run fully offline.
• Postgres-specific types (JSONB, UUID) are replaced with SQLite-compatible
  equivalents (JSON, String) before table creation using SQLAlchemy type
  overrides — no model changes required.
• Every test gets its own transaction that is rolled back at the end, so
  tests are completely isolated from each other.
• External services (S3, Deepgram, Groq) are ALWAYS mocked — no real
  network calls are made in any test.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import String, JSON, event
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.base import Base
from app.main import app
from app.api.dependencies.db import get_db


import uuid as _uuid_module
from sqlalchemy import String, JSON, TypeDecorator


class SQLiteUUID(TypeDecorator):
    """
    A TypeDecorator that stores Python UUID objects as VARCHAR(36) strings.
    This makes the Postgres UUID(as_uuid=True) columns work transparently
    with SQLite for testing without any model changes.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return _uuid_module.UUID(value)


def _patch_postgres_types():
    """
    SQLite doesn't understand Postgres-specific column types (JSONB, UUID).
    We walk all mapped tables and replace them with SQLite-compatible
    equivalents so `metadata.create_all` works on the in-memory test DB.
    This is done only once at session start, before any engine touches the
    metadata.
    """
    # Import all models so they register with Base.metadata
    import app.models.doctor          # noqa: F401
    import app.models.patient         # noqa: F401
    import app.models.consultation    # noqa: F401
    import app.models.soap_note       # noqa: F401
    import app.models.medication      # noqa: F401
    import app.models.diagnosis       # noqa: F401
    import app.models.interaction     # noqa: F401
    import app.models.guideline_chunk # noqa: F401

    try:
        from pgvector.sqlalchemy import Vector as PGVector
        _has_pgvector = True
    except ImportError:
        _has_pgvector = False

    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = JSON()
            elif isinstance(column.type, PG_UUID):
                column.type = SQLiteUUID()
            elif _has_pgvector and isinstance(column.type, PGVector):
                # Store vectors as JSON arrays in SQLite — purely for table creation;
                # vector similarity queries are mocked in tests.
                column.type = JSON()


# Patch types once at import time so they're ready before any fixture runs
_patch_postgres_types()


# ── In-memory SQLite engine (shared across the whole test session) ───────────

@pytest.fixture(scope="session")
def engine():
    """
    One SQLite engine for the entire test session.
    StaticPool ensures every connection shares the same in-memory DB.
    native_uuid=False tells SQLAlchemy to pass UUID values as plain strings
    to the driver (aiosqlite), which doesn't understand Python UUID objects.
    """
    return create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
        # Critical: SQLite doesn't have a native UUID type — pass as string
        json_serializer=lambda obj: __import__("json").dumps(obj, default=str),
    )


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables(engine):
    """Create all ORM tables once before any test runs."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── Per-test isolated DB session ─────────────────────────────────────────────

@pytest_asyncio.fixture
async def db_session(engine):
    """
    Yields a SQLAlchemy AsyncSession that is always rolled back after the
    test, guaranteeing full isolation between tests.
    """
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    async with async_session() as session:
        yield session
        await session.rollback()


# ── FastAPI test client ───────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session):
    """
    An httpx AsyncClient that talks to the FastAPI app directly (no server).
    The real `get_db` dependency is overridden with the test session so
    routes use the in-memory DB.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
