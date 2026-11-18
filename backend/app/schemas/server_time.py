"""Response schema for the server time endpoint (BUG-01)."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """The server's current time; a naive datetime is rejected, never serialised."""

    now: AwareDatetime
    timezone: Literal["UTC"]
