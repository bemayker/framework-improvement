"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime.

    `started_at` is typed `AwareDatetime`, so pydantic itself rejects a naive
    value rather than this schema silently accepting one that would render
    with no offset. It is serialised via the `field_serializer` below as
    `isoformat()`, which yields an explicit `+00:00` offset rather than
    relying on pydantic's default datetime rendering (which emits a `Z`
    suffix on some installed versions) — criterion 3 requires the explicit
    offset. `json_schema_extra` separately adds `format: date-time` to the
    generated OpenAPI schema for the field; this is a document-only
    annotation and does not change the serialiser or the wire value.
    """

    uptime_seconds: float
    started_at: AwareDatetime = Field(json_schema_extra={"format": "date-time"})

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Render as ISO 8601 with an explicit offset, e.g. `+00:00`, not `Z`."""
        return value.isoformat()
