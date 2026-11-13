"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        # isoformat() on an aware UTC value emits the explicit "+00:00" offset,
        # where Pydantic's default would emit "Z".
        return value.astimezone(UTC).isoformat()
