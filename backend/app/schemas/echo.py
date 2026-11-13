"""Request and response schemas for GET /api/echo (TEST-06)."""

from pydantic import BaseModel, Field

MAX_ECHO_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters of GET /api/echo.

    `msg` is required (no default) and bounded here, so FastAPI's own request
    validation produces the standard 422 and the handler holds no check.
    """

    msg: str = Field(max_length=MAX_ECHO_LENGTH)


class EchoResponse(BaseModel):
    """Body of a successful GET /api/echo."""

    echo: str
