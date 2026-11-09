"""Response schema for GET /api/uptime (TEST-07)."""

from pydantic import AwareDatetime, BaseModel, Field


class UptimeResponse(BaseModel):
    """Process uptime and the UTC instant the app was created.

    No custom serializer: pydantic renders an aware UTC datetime with the `Z`
    designator itself, and a serializer's return annotation would strip the
    `date-time` format from the generated OpenAPI document.
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime
