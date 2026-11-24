"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime, timezone

from pydantic import BaseModel, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float
    started_at: datetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Emit UTC with the numeric +00:00 offset, so the offset is explicit."""
        return value.astimezone(timezone.utc).isoformat()
