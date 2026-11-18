"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class ServerTimeResponse(BaseModel):
    """The server's current time, always UTC and always ending in `+00:00`.

    The offset is pinned to `+00:00` and `Z` is deliberately not used: Pydantic
    serialises a UTC-aware datetime with `Z` by default, so `now` carries an
    explicit serializer. A naive datetime is rejected by `AwareDatetime`.
    """

    now: AwareDatetime = Field(
        description=(
            "Server time, ISO 8601 in UTC with the explicit offset +00:00 "
            "(never Z, never naive)."
        )
    )
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Normalise to UTC and emit ISO 8601 with a `+00:00` suffix."""
        return value.astimezone(UTC).isoformat()
