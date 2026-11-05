"""Response schema for the server time endpoint (FEAT-1, recreated by BUG-01)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        # isoformat() emits the explicit "+00:00" offset; Pydantic's default
        # would emit "Z".
        return value.isoformat()
