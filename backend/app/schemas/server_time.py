"""Response schema for GET /api/time (FEAT-1)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The pinned UTC representation. "Explicit offset" in the acceptance criteria
# means a numeric offset, so the contract is "+00:00" and never "Z". Pydantic
# serialises an aware UTC datetime as "Z" by default, hence the serializer below.
UTC_OFFSET_SUFFIX = "+00:00"


class ServerTimeResponse(BaseModel):
    """The server's current time, always UTC with a "+00:00" suffix."""

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        return value.astimezone(UTC).isoformat()
