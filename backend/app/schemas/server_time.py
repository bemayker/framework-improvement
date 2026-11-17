"""Response schema for the server time endpoint (FEAT-1).

The schema, not the router, owns the wire format: `now` must be timezone-aware
and is always serialised in UTC with a numeric `+00:00` offset.
"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Serialise `now` in UTC with an explicit `+00:00` offset, never `Z`.

        Pydantic's default writes a UTC datetime with a `Z` designator; the
        criterion asks for an explicit offset, and `isoformat()` on a UTC value
        yields `+00:00`.
        """
        return value.astimezone(UTC).isoformat()
