"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import datetime, timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Emit UTC with an explicit `+00:00` offset (Pydantic's default is `Z`)."""
        return value.astimezone(timezone.utc).isoformat()
