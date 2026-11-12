"""Query and response schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel, Field

MAX_ECHO_MESSAGE_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters for GET /api/echo.

    The length bound lives here so FastAPI's own validation produces the
    standard 422; the handler holds no validation logic.
    """

    msg: str = Field(max_length=MAX_ECHO_MESSAGE_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
