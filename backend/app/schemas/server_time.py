"""Response schema for the server time endpoint (BUG-01, restoring FEAT-1)."""

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is a pre-formatted string so the wire format is exactly
    `datetime.isoformat()` with its `+00:00` offset, not Pydantic's `Z` form.
    """

    now: str
    timezone: str
