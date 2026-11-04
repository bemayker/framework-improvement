"""Response schema for the server-time endpoint (BUG-01, recreating FEAT-1)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Emit the numeric `+00:00` offset; Pydantic's default would emit `Z`."""
        return value.isoformat()
