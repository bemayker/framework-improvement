"""Response schema for the time endpoint (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class TimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is `AwareDatetime` rather than a bare `datetime` so a naive value is
    a validation error at construction time instead of a silent local-time
    reading. The serializer pins the wire format to the explicit `+00:00`
    offset (never `Z`) independently of Pydantic's default datetime encoder,
    and normalises any non-UTC aware input to the same instant in UTC.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        return value.astimezone(UTC).isoformat()
