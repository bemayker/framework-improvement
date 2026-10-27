"""Response schema for GET /api/time (BUG-01)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, field_serializer, field_validator


class ServerTimeResponse(BaseModel):
    """The server's current time, always an aware UTC datetime."""

    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _normalise_to_utc(cls, value: datetime) -> datetime:
        # A naive value carries no offset, so serialising it would silently
        # claim a zone the server never established.
        if value.tzinfo is None:
            raise ValueError("now must be timezone-aware")
        return value.astimezone(UTC)

    @field_serializer("now")
    def _serialise_with_explicit_offset(self, value: datetime) -> str:
        # Pydantic's default renders UTC as "Z"; the contract promises "+00:00".
        return value.isoformat()

    @classmethod
    def now_utc(cls) -> "ServerTimeResponse":
        """Build a response from the clock, read on every call (never cached)."""
        return cls(now=datetime.now(UTC))
