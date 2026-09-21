"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_serializer


class TimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` carries a timezone-aware instant. The default Pydantic datetime
    JSON serializer renders a zero UTC offset as `Z`, which would silently
    contradict the pinned `+00:00` suffix (tracker comment point 3), so the
    exact rendering is stated here via an explicit `@field_serializer`
    rather than left to that default.
    """

    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Render `now` with `datetime.isoformat()`, preserving its offset."""
        return value.isoformat()
