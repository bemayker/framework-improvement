"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: datetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Render in UTC with an explicit `+00:00` offset, not Pydantic's `Z`."""
        return value.astimezone(timezone.utc).isoformat()
