"""Response schema and input bound for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# Lives with the schema so the bound is declared once and surfaces in OpenAPI.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
