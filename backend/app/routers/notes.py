"""Routers for the notes endpoints (TEST-03): POST and GET /api/notes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate, NoteRead
from app.services.note_service import NoteService

router = APIRouter(prefix="/api/notes", tags=["notes"])


def get_note_service(session: Session = Depends(get_session)) -> NoteService:
    """Assemble the service for one request from the request-scoped session."""
    return NoteService(NoteRepository(session))


# An empty path keeps the route at "/api/notes" exactly; "/" would register
# "/api/notes/" and answer the frontend's calls with a 307 redirect.
@router.post("", status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate, service: NoteService = Depends(get_note_service)
) -> NoteRead:
    """Store one note and return it as saved."""
    return NoteRead.model_validate(service.create_note(payload))


@router.get("")
def list_notes(service: NoteService = Depends(get_note_service)) -> list[NoteRead]:
    """Return every saved note, newest first."""
    return [NoteRead.model_validate(note) for note in service.list_notes()]
