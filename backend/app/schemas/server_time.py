"""Response schema for the server time endpoint (BUG-01, recreating FEAT-1).

A Pydantic model rather than a bare dict so the response shape is declared
once and reflected in the OpenAPI schema.
"""

from pydantic import BaseModel


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    now: str
    timezone: str
