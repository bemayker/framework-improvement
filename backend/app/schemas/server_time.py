"""Response schema for the server time endpoint (FEAT-1, BUG-01)."""

from typing import Literal

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is a string, not a datetime: Pydantic v2 serialises a UTC datetime
    with a `Z` suffix, while the contract is the `+00:00` offset `isoformat()`
    produces.
    """

    now: str
    timezone: Literal["UTC"]
