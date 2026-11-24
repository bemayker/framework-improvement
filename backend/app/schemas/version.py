"""Response schema for the version endpoint (TEST-05, extended by TEST-09 with the build commit)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    commit: str
