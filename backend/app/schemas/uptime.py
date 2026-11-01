"""Response schema for GET /api/uptime (TEST-07)."""

from datetime import timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def _serialize_started_at(self, value: AwareDatetime) -> str:
        # Pinned to the numeric "+00:00" form: pydantic's default would emit "Z".
        return value.astimezone(timezone.utc).isoformat()
