"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    The offset is pinned to the literal `+00:00`, never `Z`: the acceptance
    criterion asks for an "explicit offset", and Pydantic's default JSON
    serialisation of a UTC datetime would emit `Z`. `AwareDatetime` rejects a
    naive value at construction, so a naive time can never be reported.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Render `now` in UTC with the explicit `+00:00` offset."""
        return value.astimezone(UTC).isoformat()
