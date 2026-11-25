"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime, timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime.

    The serializer returns a `str`, so the OpenAPI serialisation schema shows
    `started_at` as a plain string with no `format: date-time`. That is
    accepted: it buys the numeric `+00:00` offset, which pydantic's default
    (`Z`) would not emit.
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at", when_used="json")
    def serialize_started_at(self, value: datetime) -> str:
        """Emit UTC with an explicit `+00:00` offset, whatever zone came in."""
        return value.astimezone(timezone.utc).isoformat()
