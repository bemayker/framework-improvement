"""Response schema for GET /api/time (BUG-01)."""

import datetime as dt
from typing import Literal

from pydantic import BaseModel, field_serializer, field_validator


class ServerTimeResponse(BaseModel):
    now: dt.datetime
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _require_aware(cls, value: dt.datetime) -> dt.datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("now must be timezone-aware")
        return value

    @field_serializer("now")
    def _serialize_now(self, value: dt.datetime) -> str:
        # Explicit "+00:00" offset; Pydantic's default would emit "Z".
        return value.astimezone(dt.UTC).isoformat()
