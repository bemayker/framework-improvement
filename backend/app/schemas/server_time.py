"""Response schema for the server time endpoint (FEAT-1)."""

from typing import Literal

from pydantic import BaseModel

from app.schemas.uptime import UtcTimestamp


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is serialised as ISO 8601 in UTC with the explicit offset `+00:00`,
    never `Z` (pydantic's own default for UTC) and never naive: `UtcTimestamp`
    rejects a naive datetime and normalises any aware one to UTC. `+00:00`
    matches `started_at` on GET /api/uptime, so one convention holds across
    the API.
    """

    now: UtcTimestamp
    timezone: Literal["UTC"] = "UTC"
