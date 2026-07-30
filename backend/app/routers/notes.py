"""Router for the notes endpoints (TEST-03): POST and GET /api/notes."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate, NoteResponse
from app.services.note_service import NoteService

router = APIRouter(prefix="/api", tags=["notes"])


def get_note_service(session: Annotated[Session, Depends(get_session)]) -> NoteService:
    """Assemble the service with a repository bound to the request's session."""
    return NoteService(NoteRepository(session))


ServiceDependency = Annotated[NoteService, Depends(get_note_service)]


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, service: ServiceDependency) -> NoteResponse:
    """Store a note and return it. 422 when content is blank or missing."""
    note = service.create_note(payload.content)
    return NoteResponse.model_validate(note)


@router.get("/notes", response_model=list[NoteResponse])
def list_notes(service: ServiceDependency) -> list[NoteResponse]:
    """Return every stored note in insertion order (`id` ascending)."""
    return [NoteResponse.model_validate(note) for note in service.list_notes()]
