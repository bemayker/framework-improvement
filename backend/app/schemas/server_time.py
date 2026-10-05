"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The wire offset is pinned to `+00:00`, never `Z`: it matches the uptime
# schema's convention and round-trips through `datetime.fromisoformat`.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Emit UTC with an explicit `+00:00` offset (Pydantic's default is `Z`)."""
        return value.astimezone(UTC).replace(tzinfo=None).isoformat() + UTC_OFFSET_SUFFIX
