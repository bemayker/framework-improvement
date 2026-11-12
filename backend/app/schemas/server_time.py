"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import datetime, timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is always serialized in UTC with the numeric offset `+00:00`, never
    the `Z` designator pydantic emits by default: the contract asks for an
    "explicit offset", and `+00:00` is a literal offset where `Z` is a zone
    letter. Precision is whole seconds so the string has one fixed shape.
    A naive datetime is rejected at construction by the `AwareDatetime` type.
    """

    now: AwareDatetime
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        return value.astimezone(timezone.utc).isoformat(timespec="seconds")
