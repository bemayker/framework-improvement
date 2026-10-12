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
