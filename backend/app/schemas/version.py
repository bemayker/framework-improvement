"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    # First 12 characters of the build commit, or "unknown" when none was set.
    commit: str
