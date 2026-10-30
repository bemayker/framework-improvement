"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is serialized in UTC with the explicit numeric offset `+00:00`
    (the suffix `datetime.isoformat()` emits), never `Z`: Pydantic's default
    would emit `Z` for a UTC value, so the serializer below pins the choice.
    `AwareDatetime` rejects a naive value at validation.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        return value.astimezone(UTC).isoformat()
