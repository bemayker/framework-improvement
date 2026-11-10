"""Response schema for GET /api/time (BUG-01)."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, field_serializer, field_validator


class ServerTimeResponse(BaseModel):
    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @field_validator("now")
    @classmethod
    def _require_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("now must be a timezone-aware datetime")
        return value

    @field_serializer("now")
    def _serialize_now(self, value: datetime) -> str:
        # Explicit +00:00 offset; Pydantic's default would emit "Z".
        return value.astimezone(UTC).isoformat()
