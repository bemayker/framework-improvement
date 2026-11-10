"""Response schema for the version endpoint (TEST-05)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    # Short build commit, or "unknown" when the build did not set one.
    commit: str
