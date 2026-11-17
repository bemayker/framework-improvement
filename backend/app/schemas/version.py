"""Response schema for the version endpoint (TEST-05, commit added by TEST-09)."""

from pydantic import BaseModel


class VersionResponse(BaseModel):
    """Response body for GET /api/version: the app version and build commit."""

    version: str
    commit: str
