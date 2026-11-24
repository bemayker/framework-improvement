"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime, timezone

from pydantic import BaseModel, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float
    started_at: datetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime):  # noqa: ANN201
        """Emit UTC with the numeric +00:00 offset, so the offset is explicit.

        Deliberately unannotated: a `-> str` return type would replace the
        field's `date-time` format in the OpenAPI schema with a bare string.
        """
        return value.astimezone(timezone.utc).isoformat()
