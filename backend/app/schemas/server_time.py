"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always UTC and always serialised with the numeric `+00:00` offset,
    never the `Z` suffix and never naive. Pydantic would emit `Z` for a UTC
    datetime by default, so the serializer below pins the format explicitly.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Convert to UTC and emit ISO 8601 ending in `+00:00`."""
        return value.astimezone(timezone.utc).isoformat()
