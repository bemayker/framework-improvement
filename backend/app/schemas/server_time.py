"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The explicit UTC offset every serialised `now` ends with.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is serialised in UTC with the numeric offset `+00:00`, not the `Z`
    zone designator Pydantic would emit by default: the acceptance criterion
    asks for an explicit offset, and `+00:00` is literally one. A naive
    datetime is rejected at construction, so it can never be serialised.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Emit a fixed-shape ISO 8601 string: UTC, microsecond precision."""
        return value.astimezone(UTC).isoformat(timespec="microseconds")
