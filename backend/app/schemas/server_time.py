"""Response schema for GET /api/time (BUG-01)."""

from datetime import datetime

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    now: datetime
    timezone: str
