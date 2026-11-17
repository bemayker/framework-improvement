"""Response schema for the uptime endpoint (TEST-07).

A timezone-aware `datetime` is serialised by Pydantic as ISO 8601 with an
explicit offset (`Z` for UTC), so no custom serializer is needed.
"""

from datetime import datetime

from pydantic import BaseModel


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    uptime_seconds: float
    started_at: datetime
