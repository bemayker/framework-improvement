"""Response schema for GET /api/time (FEAT-1).

The schema owns the wire format of the timestamp, so no router builds a dict.
"""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The explicit offset is pinned to "+00:00" rather than "Z": it is the numeric
# offset form, what datetime.isoformat() emits for an aware UTC value, and
# Pydantic's default datetime serialisation would silently emit "Z" instead.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """The server's current time, always UTC with a `+00:00` offset."""

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Serialise `now` in UTC with the `+00:00` offset, never `Z`."""
        return value.astimezone(UTC).isoformat()
