"""Schemas for the uptime endpoint (TEST-07)."""

from datetime import UTC

from pydantic import AwareDatetime, BaseModel, NonNegativeFloat, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: NonNegativeFloat
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialize_started_at(self, value: AwareDatetime) -> str:
        # isoformat() keeps an explicit +00:00 offset; pydantic's default
        # would emit a trailing Z.
        return value.astimezone(UTC).isoformat()
