"""Response schema for GET /api/time."""

from datetime import datetime

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Current server time; `now` is timezone-aware and serialises with its offset."""

    now: datetime
    timezone: str
