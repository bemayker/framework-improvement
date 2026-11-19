"""Response schema for the server-time endpoint (FEAT-1, recreated by BUG-01)."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        """Serialize with an explicit offset (+00:00) rather than Pydantic's Z."""
        return value.isoformat()
