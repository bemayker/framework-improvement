"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import UTC, datetime

from pydantic import AwareDatetime, BaseModel, NonNegativeFloat, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: NonNegativeFloat
    started_at: AwareDatetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Always render UTC with an explicit +00:00 offset, never Z.

        Pydantic's default UTC rendering is "Z"; the contract pins "+00:00".
        """
        return value.astimezone(UTC).isoformat()
