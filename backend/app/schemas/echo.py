"""Response schema and input bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Longest `msg` GET /api/echo accepts; the router declares it on the query
# parameter so FastAPI enforces it and publishes it in the OpenAPI schema.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
