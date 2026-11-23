"""Response schema for the server time endpoint (FEAT-1, recreated by BUG-01)."""

from datetime import datetime

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: str
