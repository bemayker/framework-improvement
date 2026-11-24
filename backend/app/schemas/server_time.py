"""Response schema for the server time endpoint (BUG-01, recreating FEAT-1's contract)."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is an aware datetime so it always serialises with an explicit UTC
    offset, never naive.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]
