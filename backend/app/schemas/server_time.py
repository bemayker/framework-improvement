"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_validator


class ServerTimeResponse(BaseModel):
    """The server's current instant in UTC.

    The explicit offset is pinned to the `Z` zero-offset designator
    (e.g. `2026-10-22T17:29:35.123456Z`), never `+00:00` and never naive. It is
    pydantic's own JSON form of an aware UTC datetime, so no custom serializer
    is needed (a serializer's `-> str` annotation would strip `format:
    date-time` from the OpenAPI document), and it matches `started_at` on
    GET /api/uptime so the API's timestamps share one format. A validator
    converts any aware value to UTC, because pydantic would otherwise dump a
    `+02:00` input with its own offset.
    """

    now: AwareDatetime = Field(
        description=(
            "Server's current UTC instant, ISO 8601 with the 'Z' zero-offset "
            "designator, e.g. 2026-10-22T17:29:35.123456Z."
        )
    )
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _normalise_to_utc(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)
