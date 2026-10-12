"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import datetime, timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_validator


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always UTC and serialises with the `Z` offset designator
    (ISO 8601), never `+00:00` and never naive. A naive value is rejected, and
    any other offset is normalised to UTC so the suffix is always `Z`.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_validator("now")
    @classmethod
    def _normalise_to_utc(cls, value: datetime) -> datetime:
        return value.astimezone(timezone.utc)
