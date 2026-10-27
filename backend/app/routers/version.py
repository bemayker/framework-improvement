"""Router for GET /api/version (TEST-05)."""

from fastapi import APIRouter

from app.schemas.version import VersionResponse
from app.services.version_service import get_app_version, get_build_commit

router = APIRouter(prefix="/api", tags=["version"])


@router.get("/version", response_model=VersionResponse)
def get_version() -> VersionResponse:
    """Return the running application's version and build commit."""
    return VersionResponse(version=get_app_version(), commit=get_build_commit())
