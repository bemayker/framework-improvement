"""Response schema for GET /api/time (FEAT-1).

The offset is pinned here, not left to Pydantic's default: a UTC datetime
would serialise with a `Z` designator, so `now` is serialised explicitly to
the literal `+00:00` suffix that `datetime.isoformat()` emits for UTC.
"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_serializer

SERIALISED_UTC_OFFSET = "+00:00"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always serialised in UTC and always ends in `+00:00`, never `Z`
    and never naive; a naive datetime is rejected at construction.
    """

    now: AwareDatetime = Field(
        description=(
            "Server time, ISO 8601 in UTC, always ending "
            f"{SERIALISED_UTC_OFFSET} (never Z)."
        )
    )
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialise_now(self, value: datetime) -> str:
        """Render `now` converted to UTC with the pinned `+00:00` offset."""
        return value.astimezone(UTC).isoformat()
