"""Response schema for the server time endpoint (FEAT-1, BUG-01).

The offset is always spelled `+00:00`, never `Z`, to keep FEAT-1's contract.
"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Render `now` as ISO 8601 in UTC with a `+00:00` offset."""
        return value.astimezone(UTC).isoformat()
