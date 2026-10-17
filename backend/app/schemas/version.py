"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    commit: str
