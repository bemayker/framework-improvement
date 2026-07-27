"""Router layer for the notes resource. No business logic here."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.note import NoteCreate, NoteRead
from app.services.note_service import NoteService

router = APIRouter(prefix="/api/notes", tags=["notes"])


def get_note_service(session: Session = Depends(get_db)) -> NoteService:
    return NoteService(session)


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, service: NoteService = Depends(get_note_service)) -> NoteRead:
    note = service.create_note(payload.content)
    return NoteRead.model_validate(note)


@router.get("", response_model=list[NoteRead])
def list_notes(service: NoteService = Depends(get_note_service)) -> list[NoteRead]:
    notes = service.list_notes()
    return [NoteRead.model_validate(note) for note in notes]
