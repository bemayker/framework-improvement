"""Router for the notes endpoints (TEST-03): POST and GET /api/notes."""

from typing import Annotated

import psycopg
from fastapi import APIRouter, Depends, status

from app.core.db import get_connection
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate, NoteResponse
from app.services import note_service

router = APIRouter(prefix="/api", tags=["notes"])


def get_note_repository(
    connection: Annotated[psycopg.Connection, Depends(get_connection)],
) -> NoteRepository:
    """Build the repository for this request's connection."""
    return NoteRepository(connection)


NoteRepositoryDependency = Annotated[NoteRepository, Depends(get_note_repository)]


@router.post(
    "/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    payload: NoteCreate, repository: NoteRepositoryDependency
) -> NoteResponse:
    """Store a note and return it with the id the database assigned."""
    note = note_service.create_note(repository, payload.text)
    return NoteResponse(id=note.id, text=note.text)


@router.get("/notes", response_model=list[NoteResponse])
def list_notes(repository: NoteRepositoryDependency) -> list[NoteResponse]:
    """Return every stored note, ascending by id."""
    notes = note_service.list_notes(repository)
    return [NoteResponse(id=note.id, text=note.text) for note in notes]
