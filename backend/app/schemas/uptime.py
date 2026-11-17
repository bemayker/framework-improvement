"""Response schema for GET /api/uptime (TEST-07).

`started_at` is serialised explicitly so the UTC offset is literally
`+00:00`; Pydantic v2's default would emit `Z`, and the contract promises an
explicit offset.
"""

from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """How long the process has run and the instant it started."""

    uptime_seconds: float = Field(ge=0)
    started_at: datetime

    @field_serializer("started_at")
    def serialise_started_at(self, value: datetime) -> str:
        """Render the start instant as ISO 8601 in UTC with a `+00:00` offset."""
        return value.astimezone(timezone.utc).isoformat()
