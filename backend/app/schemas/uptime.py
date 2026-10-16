"""Response schema for the uptime endpoint (TEST-07)."""

from pydantic import AwareDatetime, BaseModel, Field


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime.

    `started_at` is an aware datetime so a naive timestamp is rejected, and
    Pydantic's default JSON mode writes a UTC value with the `Z` offset while
    the OpenAPI document keeps `format: date-time` (no custom serializer).
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime
