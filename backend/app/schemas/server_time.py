"""Response schema for the server time endpoint (FEAT-1, BUG-01).

`AwareDatetime` makes pydantic reject a naive value, so the serialised `now`
always carries an explicit UTC offset.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]
