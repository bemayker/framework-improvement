"""Router for GET /api/version (TEST-05)."""

from fastapi import APIRouter

from app.schemas.version import VersionResponse
from app.services.version_service import get_app_version

router = APIRouter(prefix="/api", tags=["version"])


@router.get("/version", response_model=VersionResponse)
def get_version() -> VersionResponse:
    """Return the running application's version."""
    return VersionResponse(version=get_app_version())
