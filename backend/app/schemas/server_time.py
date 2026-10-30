"""Response schema for the server-time endpoint (BUG-01)."""

from datetime import UTC, datetime
from typing import Literal, Self

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: datetime
    timezone: Literal["UTC"] = "UTC"

    @classmethod
    def now_utc(cls) -> Self:
        """Build the response from the current instant, always timezone-aware.

        A naive datetime would serialise without an offset, so the clock is
        read with an explicit UTC timezone on every call.
        """
        return cls(now=datetime.now(UTC))
