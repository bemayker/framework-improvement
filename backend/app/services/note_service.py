"""Business logic for notes (TEST-03).

Thin by design: the only client-error case (a blank note) is enforced by the
request schema and the table's CHECK constraint, so this layer holds the
trimming rule and the logging of unexpected failures, and keeps the router
free of data access.
"""

import logging
from typing import Protocol

from app.models.note import Note

logger = logging.getLogger(__name__)


class NoteRepositoryProtocol(Protocol):
    """The data-access contract this service depends on."""

    def insert_note(self, text: str) -> Note: ...

    def list_notes(self) -> list[Note]: ...

    def get_note(self, note_id: int) -> Note | None: ...

    def count_notes(self) -> int: ...

    def delete_note(self, note_id: int) -> bool: ...


def create_note(repository: NoteRepositoryProtocol, text: str) -> Note:
    """Store one note, trimmed of surrounding whitespace."""
    trimmed = text.strip()
    try:
        return repository.insert_note(trimmed)
    except Exception:
        logger.exception("Storing a note failed (text length %d)", len(trimmed))
        raise


def list_notes(repository: NoteRepositoryProtocol) -> list[Note]:
    """Return every stored note in insertion order."""
    try:
        return repository.list_notes()
    except Exception:
        logger.exception("Listing notes failed")
        raise


def get_note(repository: NoteRepositoryProtocol, note_id: int) -> Note | None:
    """Return the note with this id, or None when it does not exist."""
    try:
        return repository.get_note(note_id)
    except Exception:
        logger.exception("Reading a note failed (id %d)", note_id)
        raise


def count_notes(repository: NoteRepositoryProtocol) -> int:
    """Return how many notes are stored."""
    try:
        return repository.count_notes()
    except Exception:
        logger.exception("Counting notes failed")
        raise


def delete_note(repository: NoteRepositoryProtocol, note_id: int) -> bool:
    """Delete the note with this id; False when it does not exist."""
    try:
        return repository.delete_note(note_id)
    except Exception:
        logger.exception("Deleting a note failed (id %d)", note_id)
        raise
