"""Response schema for GET /api/time (FEAT-1, restored with BUG-01).

`now` is an `AwareDatetime` so Pydantic rejects a naive datetime: the endpoint
must always state its UTC offset explicitly.
"""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """The current server time and the zone it is expressed in."""

    now: AwareDatetime
    timezone: Literal["UTC"]
