"""Response schema for GET /api/time (FEAT-1, BUG-01).

`AwareDatetime` rejects a naive datetime, so the "never naive" rule is
enforced by the type rather than by a hand-written check. The serializer
emits an explicit `+00:00` offset instead of Pydantic's default `Z`.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """The server's current time and the timezone it is expressed in."""

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Render `now` as ISO 8601 with an explicit UTC offset."""
        return value.isoformat()
