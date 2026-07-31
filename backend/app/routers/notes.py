"""Router for the notes endpoints (TEST-03).

No business logic here (coding_standards.md Section 2.2): validation is the
schema's job, persistence and the transaction are the service's.
"""

import psycopg
from fastapi import APIRouter, Depends, status

from app.core.db import get_connection
from app.models.note import Note
from app.schemas.note import NoteCreateRequest, NoteResponse
from app.services import note_service

router = APIRouter(prefix="/api", tags=["notes"])


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreateRequest,
    connection: psycopg.Connection = Depends(get_connection),
) -> Note:
    """Store one note. Blank text is rejected by the schema with a 422."""
    return note_service.create_note(connection, payload.text)


@router.get("/notes", response_model=list[NoteResponse])
def list_notes(
    connection: psycopg.Connection = Depends(get_connection),
) -> list[Note]:
    """Return every stored note, oldest first. Empty list when none exist."""
    return note_service.list_notes(connection)
