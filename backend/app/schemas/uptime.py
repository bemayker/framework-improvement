"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at", when_used="json")
    def serialise_started_at(self, value: AwareDatetime) -> str:
        """Write started_at in UTC with a numeric `+00:00` offset, not `Z`."""
        return value.astimezone(timezone.utc).isoformat()
