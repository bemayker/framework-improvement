"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        # isoformat() renders a UTC value with an explicit "+00:00" offset;
        # pydantic's default would emit the "Z" designator instead.
        return value.isoformat()
