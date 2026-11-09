"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def _serialize_now(self, value: AwareDatetime) -> str:
        # Pydantic's default JSON encoding spells UTC as "Z"; the contract pins
        # the numeric "+00:00" offset, whatever aware offset came in.
        return value.astimezone(UTC).isoformat()
