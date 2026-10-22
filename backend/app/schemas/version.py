"""Response schema for the version endpoint (TEST-05, TEST-09)."""

from pydantic import BaseModel, Field


class VersionResponse(BaseModel):
    """Response body for GET /api/version."""

    version: str
    commit: str = Field(
        description=(
            "First 12 characters of the BUILD_COMMIT environment variable; "
            "'unknown' when it is unset or blank."
        )
    )
