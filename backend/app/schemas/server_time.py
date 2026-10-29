"""Response schema for GET /api/time (BUG-01 recreates the FEAT-1 slice)."""

from datetime import UTC, datetime
from typing import Literal, Self

from pydantic import BaseModel, field_serializer, field_validator


def _utc_now() -> datetime:
    """Read the clock; a function so tests can step it without sleeping."""
    return datetime.now(UTC)


class ServerTimeResponse(BaseModel):
    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _normalise_to_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("now must be timezone-aware")
        return value.astimezone(UTC)

    @field_serializer("now")
    def _serialise_now(self, value: datetime) -> str:
        # Pydantic's default renders a "Z" suffix; the contract is "+00:00".
        return value.isoformat()

    @classmethod
    def now_utc(cls) -> Self:
        """Build a response from the clock, read on every call (never at import)."""
        return cls(now=_utc_now())
