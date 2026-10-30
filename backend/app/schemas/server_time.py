"""Response schema for the server-time endpoint (BUG-01)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: Literal["UTC"] = "UTC"
