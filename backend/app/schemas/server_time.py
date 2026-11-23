"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """The server's current time, always serialised in UTC.

    The offset is pinned to `+00:00`, never `Z`: the acceptance criterion asks
    for an explicit offset, and `+00:00` is a numeric offset where `Z` is a
    zone designator. Pydantic's default output for an aware UTC datetime is
    `Z`, so the serializer below enforces the choice instead of leaving it to
    that default. `now` is an `AwareDatetime`, so a naive value is rejected.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Render `now` as ISO 8601 UTC with microseconds and a `+00:00` suffix."""
        return value.astimezone(UTC).isoformat(timespec="microseconds")
