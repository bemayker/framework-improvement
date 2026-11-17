"""Response schema for GET /api/time (FEAT-1, BUG-01).

`AwareDatetime` makes pydantic reject a naive value at construction, so the
serialised `now` always carries an explicit offset.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """The server's current UTC time."""

    now: AwareDatetime
    timezone: Literal["UTC"]
