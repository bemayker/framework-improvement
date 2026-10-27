"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The offset is pinned to "+00:00" rather than "Z": "+00:00" is a numeric
# offset every client parses as one, while "Z" is a zone designator some do
# not. Pydantic's default for a UTC datetime is "Z", so the serializer below
# is what makes this constant true on the wire.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        """Render `now` in UTC, ending in UTC_OFFSET_SUFFIX."""
        return value.astimezone(UTC).isoformat()
