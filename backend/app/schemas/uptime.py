"""Response schema for the uptime endpoint (TEST-07).

`started_at` is serialised with an explicit `+00:00` offset rather than
Pydantic's default `Z` suffix, so the wire format satisfies a literal reading
of "UTC with an explicit offset".
"""

from datetime import datetime, timezone

from pydantic import BaseModel, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float
    started_at: datetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Render the start time as ISO 8601 UTC with a `+00:00` offset."""
        return value.astimezone(timezone.utc).isoformat()
