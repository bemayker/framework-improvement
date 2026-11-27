"""Query and response schemas for the echo endpoint (TEST-06).

The 200-character bound lives here, declaratively, so FastAPI rejects an
over-long `msg` with its standard 422 before the router handler runs.
"""

from pydantic import BaseModel, Field

ECHO_MSG_MAX_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters for GET /api/echo."""

    msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
