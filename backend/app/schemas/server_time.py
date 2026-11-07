"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# Pydantic's default JSON output for a UTC datetime is the "Z" designator. The
# contract is a numeric offset, so the serializer below pins this suffix.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """The server's current time, always UTC, always ending in `+00:00`.

    `now` rejects a naive datetime (no offset) at validation time and is
    normalised to UTC when serialised, so a client never sees `Z` or a local
    offset.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def _serialize_now(self, value: AwareDatetime) -> str:
        return value.astimezone(UTC).isoformat()
