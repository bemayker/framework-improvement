"""Response schema for GET /api/time (BUG-01, recreating FEAT-1's endpoint)."""

from typing import Literal

from pydantic import AwareDatetime, BaseModel


class ServerTimeResponse(BaseModel):
    """Body of GET /api/time; AwareDatetime rejects a naive datetime by type."""

    now: AwareDatetime
    timezone: Literal["UTC"]
