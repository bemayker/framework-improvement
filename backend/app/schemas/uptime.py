"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at", when_used="json")
    def _serialize_started_at(self, value: AwareDatetime) -> str:
        """Emit an explicit `+00:00` offset; Pydantic's default would emit `Z`."""
        return value.astimezone(timezone.utc).isoformat()
