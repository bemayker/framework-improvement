"""Response schema for the server time endpoint (FEAT-1).

The offset format is pinned here rather than left to pydantic's default,
which would serialise an aware UTC datetime with a `Z` suffix.
"""

from datetime import UTC
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, WithJsonSchema, field_serializer

# The serializer returns `str`, which would drop "format" from the OpenAPI
# document; /docs must keep showing `now` as a date-time string.
_DateTimeString = Annotated[
    str, WithJsonSchema({"type": "string", "format": "date-time"})
]


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always serialised in UTC with the numeric offset `+00:00` (never
    `Z`) and six fractional digits: `YYYY-MM-DDTHH:MM:SS.ffffff+00:00`.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> _DateTimeString:
        """Render `now` as fixed-width ISO 8601 in UTC with a `+00:00` offset."""
        return value.astimezone(UTC).isoformat(timespec="microseconds")
