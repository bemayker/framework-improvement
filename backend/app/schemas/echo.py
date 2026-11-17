"""Schemas for GET /api/echo (TEST-06).

The 200-character bound lives on the query model, not in the handler, so
FastAPI's own request validation produces the standard 422.
"""

from pydantic import BaseModel, Field

MAX_ECHO_MESSAGE_LENGTH = 200


class EchoQuery(BaseModel):
    """Query parameters of the echo endpoint: a required, bounded message."""

    msg: str = Field(max_length=MAX_ECHO_MESSAGE_LENGTH)


class EchoResponse(BaseModel):
    """Response body of the echo endpoint."""

    echo: str
