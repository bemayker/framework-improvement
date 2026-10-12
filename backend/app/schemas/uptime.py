"""Response schema for the uptime endpoint (TEST-07)."""

from pydantic import AwareDatetime, BaseModel, Field


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime.

    `started_at` is an offset-aware datetime so a naive timestamp is rejected
    and a UTC value serialises with an explicit `Z` offset.
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime
