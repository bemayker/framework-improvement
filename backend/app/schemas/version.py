"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version.

    `commit` is the build commit truncated to 12 characters, or "unknown".
    """

    version: str
    commit: str
