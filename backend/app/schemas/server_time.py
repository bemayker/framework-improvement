"""Response schema for the server-time endpoint (BUG-01).

`AwareDatetime` rejects a naive value, so the explicit UTC offset in the
serialised `now` is guaranteed by the type rather than by convention.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: AwareDatetime
    timezone: Literal["UTC"]
