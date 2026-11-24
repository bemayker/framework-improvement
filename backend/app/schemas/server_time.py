"""Response schema for the server time endpoint (FEAT-1).

The offset is pinned to `+00:00` and never `Z`: the criterion asks for an
explicit offset, `+00:00` is a numeric offset where `Z` is a designator, and
Pydantic's default JSON serialisation of a UTC datetime would emit `Z`.
"""

from datetime import datetime, timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always serialised in UTC with the `+00:00` suffix and six
    fractional digits, for example `2026-11-24T04:38:10.123456+00:00`.
    """

    # The str-returning serializer makes the serialization-mode schema a plain
    # string, so the date-time format is pinned here for the OpenAPI page.
    now: AwareDatetime = Field(
        description="Server time, ISO 8601 in UTC with the explicit +00:00 offset.",
        json_schema_extra={"format": "date-time"},
    )
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Render `now` in UTC with the +00:00 suffix, never Z."""
        return value.astimezone(timezone.utc).isoformat(timespec="microseconds")
