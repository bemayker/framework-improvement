"""Response schema for GET /api/uptime (TEST-07)."""

from pydantic import AwareDatetime, BaseModel, Field


class UptimeResponse(BaseModel):
    """How long the process has run, and the UTC instant it started.

    `started_at` is an AwareDatetime with no custom serializer: pydantic's
    default JSON form of an aware UTC datetime is ISO 8601 with the `Z`
    zero-offset designator, and a serializer's `-> str` annotation would strip
    `format: date-time` from the OpenAPI document.
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime
