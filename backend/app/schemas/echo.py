"""Schema module for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# The one place the bound lives; the router declares it on the query parameter
# so FastAPI enforces it and publishes it as `maxLength` in the OpenAPI schema.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
