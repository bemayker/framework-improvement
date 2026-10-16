"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, AwareDatetime, BaseModel, Field


def _as_utc(value: datetime) -> datetime:
    """Convert any aware datetime to UTC so the JSON suffix is always `Z`."""
    return value.astimezone(UTC)


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    Pinned format: `now` is ISO 8601 in UTC and always ends in `Z`, never
    `+00:00` and never naive. `AwareDatetime` rejects a naive value, the
    after-validator normalises any offset to UTC, and Pydantic's default JSON
    mode writes a UTC value with `Z` (no custom serializer, so the OpenAPI
    document keeps `format: date-time`, as for the uptime endpoint).
    """

    now: Annotated[
        AwareDatetime,
        AfterValidator(_as_utc),
        Field(description="Server time, ISO 8601 in UTC, always ending in Z."),
    ]
    timezone: Literal["UTC"]
