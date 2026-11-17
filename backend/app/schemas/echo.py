"""Response schema and length bound for the echo endpoint (TEST-06).

The bound lives here, once, so the router's query validation and the response
model share one source and the limit is declared rather than hand-checked.
"""

from pydantic import BaseModel, Field

ECHO_MSG_MAX_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str = Field(max_length=ECHO_MSG_MAX_LENGTH)
