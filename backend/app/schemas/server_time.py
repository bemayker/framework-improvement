"""Response schema for the server-time endpoint (FEAT-1, recreated by BUG-01).

AwareDatetime rejects a naive value at construction, so the explicit UTC
offset the contract promises cannot be lost by a careless caller.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]
