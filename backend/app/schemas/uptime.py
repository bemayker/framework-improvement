"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import timezone
from typing import Annotated

from pydantic import AwareDatetime, BaseModel, Field, PlainSerializer, WithJsonSchema

# The serializer gives the explicit "+00:00" offset (pydantic's default for UTC
# is a "Z" suffix); the JSON-schema override keeps `format: date-time` in the
# published OpenAPI document, which a bare `-> str` serializer would drop.
UtcTimestamp = Annotated[
    AwareDatetime,
    PlainSerializer(
        lambda value: value.astimezone(timezone.utc).isoformat(),
        return_type=str,
        when_used="json",
    ),
    WithJsonSchema({"type": "string", "format": "date-time"}),
]


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float = Field(ge=0)
    started_at: UtcTimestamp
