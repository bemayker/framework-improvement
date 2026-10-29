"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is pinned to the literal `+00:00` offset. Pydantic's default JSON
    serialisation of a UTC datetime emits `Z`, so the serializer below is what
    keeps the wire format on `+00:00`. `AwareDatetime` rejects a naive value.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: AwareDatetime) -> str:
        return value.astimezone(timezone.utc).isoformat()
