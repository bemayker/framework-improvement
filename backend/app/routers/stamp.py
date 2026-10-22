"""Router for GET /api/stamp (FEAT-6)."""

from fastapi import APIRouter

from app.schemas.stamp import StampResponse
from app.services import stamp_service

router = APIRouter(prefix="/api", tags=["stamp"])


@router.get("/stamp", response_model=StampResponse)
def get_stamp() -> StampResponse:
    """Return the stamp and whether the database answered SELECT 1."""
    report = stamp_service.get_stamp()
    return StampResponse(stamp=report.stamp, db=report.db)
