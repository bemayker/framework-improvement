"""Routers for the notes endpoints (TEST-03).

Request validation and dependency injection only; the trimming and non-empty
rule lives in the service layer (`coding_standards.md` Section 2.2).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse
from app.services import note_service

router = APIRouter(prefix="/api", tags=["notes"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, session: DbSession) -> Note:
    """Store a note and return it as persisted."""
    return note_service.create_note(session, payload.text)


@router.get("/notes", response_model=list[NoteResponse])
def list_notes(session: DbSession) -> list[Note]:
    """Return every saved note, oldest first."""
    return note_service.list_notes(session)
