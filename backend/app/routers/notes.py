"""Router for the notes endpoints: POST and GET /api/notes (TEST-03) and
GET /api/notes/{note_id} (TEST-12), DELETE /api/notes/{note_id} (TEST-14) and
GET /api/notes/count (TEST-15)."""

from typing import Annotated

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.db import get_connection
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCountResponse, NoteCreate, NoteResponse
from app.services import note_service

router = APIRouter(prefix="/api", tags=["notes"])

NOTE_NOT_FOUND_DETAIL = "Note not found"


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


# Must stay declared before `/notes/{note_id}`: routes match in declaration
# order and `{note_id}` would capture "count", answering 422 (not an int).
@router.get("/notes/count", response_model=NoteCountResponse)
def count_notes(repository: NoteRepositoryDependency) -> NoteCountResponse:
    """Return how many notes are stored."""
    return NoteCountResponse(count=note_service.count_notes(repository))


@router.get(
    "/notes/{note_id}",
    response_model=NoteResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": NOTE_NOT_FOUND_DETAIL}},
)
def get_note(note_id: int, repository: NoteRepositoryDependency) -> NoteResponse:
    """Return one stored note by id; 404 when no note has that id."""
    note = note_service.get_note(repository, note_id)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=NOTE_NOT_FOUND_DETAIL
        )
    return NoteResponse(id=note.id, text=note.text)


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    responses={status.HTTP_404_NOT_FOUND: {"description": NOTE_NOT_FOUND_DETAIL}},
)
def delete_note(note_id: int, repository: NoteRepositoryDependency) -> Response:
    """Delete one stored note by id; 204 with no body, 404 when no note has that id."""
    if not note_service.delete_note(repository, note_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=NOTE_NOT_FOUND_DETAIL
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
