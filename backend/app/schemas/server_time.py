"""Schemas for the server time endpoint (FEAT-1)."""

from datetime import UTC
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    ``now`` is always serialised as UTC with the explicit ``+00:00`` offset
    (never ``Z``, never naive), the same convention as the uptime endpoint.
    """

    now: AwareDatetime = Field(
        description="Server time, ISO 8601 in UTC with the explicit +00:00 offset."
    )
    timezone: Literal["UTC"] = "UTC"

    @field_serializer("now")
    def _serialize_now(self, value: AwareDatetime) -> str:
        # isoformat() keeps an explicit +00:00 offset; pydantic's default
        # would emit a trailing Z.
        return value.astimezone(UTC).isoformat()
