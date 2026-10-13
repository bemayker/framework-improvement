"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    # Sourced from the BUILD_COMMIT environment variable via get_build_commit().
    commit: str
