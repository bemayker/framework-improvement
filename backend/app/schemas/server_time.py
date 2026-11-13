"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    The offset choice is pinned here: `now` is always UTC and always carries
    the numeric `+00:00` offset, never the `Z` zone designator and never a
    naive value. Pydantic's default serialisation emits `Z` for UTC, so the
    serializer below overrides it. Microseconds are always emitted so the
    field has a single shape even when the microsecond part is zero.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        return value.astimezone(UTC).isoformat(timespec="microseconds")
