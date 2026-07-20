"""
cache_service.py
~~~~~~~~~~~~~~~~
Thin async wrapper around the Upstash Redis REST client.

Design goals:
- A Redis error NEVER breaks an API request — cache misses fall through to the DB.
- JSON is the wire format; Pydantic model dicts are stored so deserialisation is
  handled by the caller (they already have the schema).
- All public methods are safe to call even if UPSTASH credentials are not set
  (e.g. local dev without Redis) — they simply no-op.
"""

import json
from typing import Any

from app.core.config import settings
from app.core.logger import logger

# ── TTL constants (seconds) ──────────────────────────────────────────────────

TTL_DOCTOR = 600        # 10 min  — doctor profile changes rarely
TTL_PATIENTS_LIST = 300 # 5 min   — patient list
TTL_PATIENT = 300       # 5 min   — individual patient
TTL_CONSULTATIONS = 15  # 15 s    — short: list refreshes after recording completes
TTL_CONSULTATION = 15   # 15 s    — short: allows prompt status updates during polling
TTL_STATS = 300         # 5 min   — dashboard stats


# ── Cache key helpers ─────────────────────────────────────────────────────────

def key_doctor(clerk_user_id: str) -> str:
    return f"doctor:clerk:{clerk_user_id}"

def key_patients_list(doctor_id: str) -> str:
    return f"patients:{doctor_id}"

def key_patient(doctor_id: str, patient_id: str) -> str:
    return f"patient:{doctor_id}:{patient_id}"

def key_consultations_list(doctor_id: str, patient_id: str) -> str:
    return f"consultations:{doctor_id}:{patient_id}"

def key_consultation(doctor_id: str, consultation_id: str) -> str:
    return f"consultation:{doctor_id}:{consultation_id}"

def key_stats(doctor_id: str) -> str:
    return f"stats:{doctor_id}"


# ── Service ──────────────────────────────────────────────────────────────────

class _CacheService:
    """
    Lazy-initialised Redis client. If credentials are missing or Redis is
    unreachable, every method silently no-ops.
    """

    def __init__(self):
        self._client = None
        self._enabled = bool(
            settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN
        )
        if self._enabled:
            try:
                from upstash_redis.asyncio import Redis
                self._client = Redis(
                    url=settings.UPSTASH_REDIS_REST_URL,
                    token=settings.UPSTASH_REDIS_REST_TOKEN,
                )
                logger.info("Upstash Redis cache initialised.")
            except Exception as exc:
                logger.warning(f"Failed to initialise Redis client: {exc}. Caching disabled.")
                self._enabled = False

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get(self, key: str) -> Any | None:
        """Return the cached value (parsed from JSON) or None on miss/error."""
        if not self._enabled:
            return None
        try:
            raw = await self._client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning(f"Cache GET error for key '{key}': {exc}")
            return None

    # ── Write ─────────────────────────────────────────────────────────────────

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Serialise value to JSON and store with the given TTL in seconds."""
        if not self._enabled:
            return
        try:
            await self._client.set(key, json.dumps(value), ex=ttl)
        except Exception as exc:
            logger.warning(f"Cache SET error for key '{key}': {exc}")

    # ── Invalidation ──────────────────────────────────────────────────────────

    async def delete(self, *keys: str) -> None:
        """Delete one or more keys. Silently ignores errors."""
        if not self._enabled or not keys:
            return
        try:
            await self._client.delete(*keys)
            logger.debug(f"Cache invalidated: {keys}")
        except Exception as exc:
            logger.warning(f"Cache DELETE error for keys {keys}: {exc}")


# Singleton instance — import this everywhere
cache = _CacheService()
