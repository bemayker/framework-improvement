"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is serialised with the explicit numeric offset `+00:00`, never `Z`,
    the same format UptimeResponse uses, so the API emits one timestamp style.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now", when_used="json")
    def _serialize_now(self, value: AwareDatetime) -> str:
        """Emit an explicit `+00:00` offset; Pydantic's default would emit `Z`."""
        return value.astimezone(timezone.utc).isoformat()
