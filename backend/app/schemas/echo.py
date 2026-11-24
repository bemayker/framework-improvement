"""Schema and bound for the echo endpoint (TEST-06).

The length bound lives beside the response model so it is stated in the schema
layer and surfaces in the generated OpenAPI document, not in handler code.
"""

from pydantic import BaseModel

MAX_ECHO_MSG_LENGTH = 200


class EchoResponse(BaseModel):
    """Response body for GET /api/echo."""

    echo: str
