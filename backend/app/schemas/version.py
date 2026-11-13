"""Response schema for the version endpoint (TEST-05, extended by TEST-09)."""

from pydantic import BaseModel, Field


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    commit: str = Field(description="Build commit, at most its first 12 characters.")
