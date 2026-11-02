"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import UTC, datetime

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialize_started_at(self, value: datetime) -> str:
        # Pydantic would spell UTC as "Z"; the contract pins the "+00:00" offset.
        return value.astimezone(UTC).isoformat()
