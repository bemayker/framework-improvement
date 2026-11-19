"""Response schema for GET /api/time (FEAT-1, restored by BUG-01)."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """The server's current time; `now` must carry an explicit UTC offset."""

    now: AwareDatetime
    timezone: Literal["UTC"]
