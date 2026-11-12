"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import datetime, timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialise_started_at(self, value: datetime) -> str:
        # isoformat() on a UTC value yields "+00:00"; Pydantic's default would
        # emit a trailing "Z", and the criterion asks for an explicit offset.
        return value.astimezone(timezone.utc).isoformat()
