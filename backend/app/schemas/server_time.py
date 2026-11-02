"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The wire format pins a numeric UTC offset rather than the "Z" designator.
# Pydantic's default JSON mode writes "Z" for UTC, so the serializer below
# overrides it explicitly: it is the contract, not an accident of the library.
# It is what datetime.isoformat() emits for an aware UTC value, so clients can
# round-trip it with datetime.fromisoformat.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` must be timezone-aware: a naive value is rejected at construction,
    so a time without an offset can never reach the wire.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Emit `now` converted to UTC, always ending in `UTC_OFFSET_SUFFIX`."""
        return value.astimezone(UTC).isoformat()
