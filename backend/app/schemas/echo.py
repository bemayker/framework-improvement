"""Query and response schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel, Field

ECHO_MSG_MAX_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters for GET /api/echo (TEST-06).

    `msg` has no default, so it is required; the length bound is declared here
    so FastAPI answers 422 itself and the handler carries no check.
    """

    msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)


class EchoResponse(BaseModel):
    """Response body for GET /api/echo (TEST-06)."""

    echo: str
