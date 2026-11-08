"""Response schema for the version endpoint (TEST-05)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    commit: str  # TEST-09: build commit, shortened by the service layer
