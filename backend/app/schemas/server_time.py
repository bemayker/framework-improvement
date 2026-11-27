"""Response schema for the server time endpoint (BUG-01)."""

from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Emit ISO 8601 with an explicit +00:00 offset."""
        return value.isoformat()
