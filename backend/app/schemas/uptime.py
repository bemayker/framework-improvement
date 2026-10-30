"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialize_started_at(self, value: datetime) -> str:
        # isoformat() keeps the numeric offset (+00:00); Pydantic's default
        # would emit "Z" for UTC.
        return value.isoformat()
