"""Response schema for GET /api/time."""

from datetime import datetime

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """The server's current time; `now` is timezone-aware, so it serialises with an offset."""

    now: datetime
    timezone: str
