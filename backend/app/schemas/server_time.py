"""Response schema for the server time endpoint (BUG-01, recreating FEAT-1's slice)."""

from datetime import UTC, datetime
from typing import Literal, Self

from pydantic import BaseModel, field_serializer, field_validator


def _utc_now() -> datetime:
    """Read the clock; a module-level seam so tests can step time without sleeping."""
    return datetime.now(UTC)


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _require_aware_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("now must be timezone-aware")
        return value.astimezone(UTC)

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        # isoformat() renders the offset as +00:00; Pydantic's default would render Z.
        return value.isoformat()

    @classmethod
    def now_utc(cls) -> Self:
        """Build a response from the clock as read right now, never at import."""
        return cls(now=_utc_now())
