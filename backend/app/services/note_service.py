"""Business logic for notes (TEST-03)."""

import logging
from typing import Protocol

from app.core.exceptions import ValidationError
from app.models.note import Note

logger = logging.getLogger(__name__)


class NoteRepositoryProtocol(Protocol):
    """The persistence surface `NoteService` depends on.

    Declared as a Protocol (`coding_standards.md` Section 2.1, Contracts) so
    the service can be unit-tested against a stub with no database.
    """

    def add(self, content: str) -> Note: ...

    def list_all(self) -> list[Note]: ...


class NoteService:
    """Creates and lists notes."""

    def __init__(self, repository: NoteRepositoryProtocol) -> None:
        self._repository = repository

    def create_note(self, content: str) -> Note:
        """Store a note, trimmed.

        Raises `ValidationError` for empty or whitespace-only content. The
        request schema rejects that shape first for HTTP callers, so this guard
        is what keeps the rule true for any other caller of the service.
        """
        trimmed = content.strip()
        if not trimmed:
            logger.warning("Rejected a note with empty or whitespace-only content.")
            raise ValidationError("Note content must not be empty.")
        return self._repository.add(trimmed)

    def list_notes(self) -> list[Note]:
        """Return every stored note in insertion order."""
        return self._repository.list_all()
