"""Response schema for the server-time endpoint (BUG-01, recreating FEAT-1's contract)."""

from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Serialise with an explicit `+00:00` offset rather than Pydantic's `Z`."""
        return value.isoformat()
