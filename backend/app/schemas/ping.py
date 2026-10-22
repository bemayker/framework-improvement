"""Response schema for the ping endpoint (FEAT-4)."""

from typing import Literal

from pydantic import BaseModel


class PingResponse(BaseModel):
    """Response body for GET /api/ping: two constants, pinned by Literal."""

    status: Literal["ok"]
    service: Literal["backend"]
