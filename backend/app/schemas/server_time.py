"""Response schema for GET /api/time (BUG-01, recreating FEAT-1's endpoint)."""

from typing import Literal

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    now: str
    timezone: Literal["UTC"]
