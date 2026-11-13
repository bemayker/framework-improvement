"""Query and response schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel, Field

MAX_ECHO_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters for GET /api/echo.

    The length bound lives here, not in the handler, so FastAPI's own request
    validation produces the 422 for a missing or over-long `msg`.
    """

    msg: str = Field(max_length=MAX_ECHO_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
