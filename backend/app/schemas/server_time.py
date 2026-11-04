"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """The server's current time, always in UTC.

    The explicit offset is pinned to `+00:00`, not `Z`: it is a numeric offset
    and is what `datetime.isoformat()` produces for an aware UTC value, whereas
    Pydantic's default serialisation would emit `Z`. `now` must be aware, so a
    naive value is rejected rather than silently read as UTC.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        return value.astimezone(UTC).isoformat()
