"""Response schema for the server time endpoint (FEAT-1, BUG-01).

`now` is an aware datetime so a naive value is rejected at construction and
the serialised form always carries an explicit UTC offset.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]
