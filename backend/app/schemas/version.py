"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    # First 12 characters of BUILD_COMMIT, or "unknown" when it is unset.
    commit: str
