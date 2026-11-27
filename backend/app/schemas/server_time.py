"""Response schema for the server-time endpoint (FEAT-1, BUG-01)."""

from typing import Literal

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is a string rather than a datetime so the explicit `+00:00` offset
    is what the service produced, not what a Pydantic version serialises.
    """

    now: str
    timezone: Literal["UTC"]
