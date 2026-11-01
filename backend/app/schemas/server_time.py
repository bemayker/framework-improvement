"""Response schema for GET /api/time (FEAT-1).

The wire format pins the explicit numeric UTC offset `+00:00`, not the `Z`
designator pydantic emits by default: the offset is spelled out literally and
matches what `datetime.isoformat()` produces for an aware UTC value.
"""

from datetime import datetime, timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

UTC_OFFSET_SUFFIX = "+00:00"


class TimeResponse(BaseModel):
    # AwareDatetime rejects naive values, which is the "never naive" guard.
    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Emit UTC with the pinned `+00:00` suffix whatever offset came in."""
        return value.astimezone(timezone.utc).isoformat(timespec="microseconds")
