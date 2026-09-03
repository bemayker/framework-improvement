"""Request bound and response schema for the echo endpoint (TEST-06)."""

from pydantic import BaseModel

# The endpoint reflects its input straight back into the response body, so an
# upper bound belongs in the contract: without one a caller could make the
# response as large as the query string the server accepts. Declared here so
# the router references the bound rather than restating it.
ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
