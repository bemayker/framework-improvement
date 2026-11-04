"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import UTC

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialize_started_at(self, value: AwareDatetime) -> str:
        """Always emit UTC with the explicit +00:00 offset (pydantic's default is Z)."""
        return value.astimezone(UTC).isoformat()
