"""Schemas for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Declared on the endpoint's `msg` query parameter, so FastAPI rejects longer
# values with its standard 422 before the handler runs.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
