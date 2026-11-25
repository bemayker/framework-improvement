"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is serialised in UTC with the numeric `+00:00` offset, never `Z`:
    the criterion asks for an explicit offset, and pydantic's default would
    emit `Z`, a zone designator. A naive datetime is rejected at construction.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, now: datetime) -> str:
        """Pin the wire format to UTC with a `+00:00` suffix."""
        return now.astimezone(UTC).isoformat()
