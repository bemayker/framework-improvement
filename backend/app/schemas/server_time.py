"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_serializer

# The offset is pinned to "+00:00" rather than "Z": the criterion asks for an
# explicit numeric offset, and Pydantic's JSON mode would otherwise serialise
# a UTC datetime with a "Z" suffix.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """The server's current time.

    `now` is an ISO 8601 timestamp in UTC that always ends in exactly
    `UTC_OFFSET_SUFFIX` ("+00:00", never "Z"). A naive datetime is rejected;
    an aware non-UTC datetime is converted to the same instant in UTC.
    """

    now: AwareDatetime = Field(
        description=f"Server time, ISO 8601 in UTC, always ending in {UTC_OFFSET_SUFFIX}."
    )
    timezone: Literal["UTC"]

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        return value.astimezone(UTC).isoformat()
